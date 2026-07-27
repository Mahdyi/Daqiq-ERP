BEGIN;

CREATE OR REPLACE FUNCTION private.validate_app_roles(app_roles text[])
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
DECLARE
  role_value text;
  normalized_roles text[];
BEGIN
  IF app_roles IS NULL OR array_length(app_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one role is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(normalized_role ORDER BY normalized_role)
  INTO normalized_roles
  FROM (
    SELECT DISTINCT lower(btrim(role_item)) AS normalized_role
    FROM unnest(app_roles) AS role_item
    WHERE role_item IS NOT NULL
      AND length(btrim(role_item)) > 0
  ) AS roles;

  IF normalized_roles IS NULL OR array_length(normalized_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one role is required'
      USING ERRCODE = '22023';
  END IF;

  FOREACH role_value IN ARRAY normalized_roles LOOP
    IF role_value NOT IN ('admin', 'manager', 'accountant', 'sales', 'warehouse', 'viewer') THEN
      RAISE EXCEPTION 'Invalid application role'
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  RETURN normalized_roles;
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_user_json(target_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', app_user.id,
    'email', app_user.email,
    'displayName', app_user.display_name,
    'active', app_user.active,
    'roles', COALESCE(
      (
        SELECT jsonb_agg(user_role.app_role ORDER BY user_role.app_role)
        FROM private.app_user_roles user_role
        WHERE user_role.user_id = app_user.id
      ),
      '[]'::jsonb
    ),
    'createdAt', app_user.created_at,
    'updatedAt', app_user.updated_at,
    'lastLoginAt', app_user.last_login_at
  )
  FROM private.app_users app_user
  WHERE app_user.id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION private.replace_app_user_roles(
  target_user_id uuid,
  app_roles text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  normalized_roles text[];
  role_value text;
BEGIN
  normalized_roles := private.validate_app_roles(app_roles);

  DELETE FROM private.app_user_roles
  WHERE user_id = target_user_id;

  FOREACH role_value IN ARRAY normalized_roles LOOP
    INSERT INTO private.app_user_roles (user_id, app_role)
    VALUES (target_user_id, role_value);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION private.revoke_user_refresh_sessions(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  affected_count integer;
BEGIN
  UPDATE private.auth_refresh_sessions
  SET revoked_at = COALESCE(revoked_at, statement_timestamp())
  WHERE user_id = target_user_id
    AND revoked_at IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_list_users(
  search text DEFAULT NULL,
  active boolean DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  active_filter ALIAS FOR $2;
  normalized_search text;
  resolved_page integer;
  resolved_page_size integer;
  total_items integer;
  items jsonb;
BEGIN
  normalized_search := lower(btrim(COALESCE(search, '')));
  resolved_page := GREATEST(COALESCE(page_number, 1), 1);
  resolved_page_size := LEAST(GREATEST(COALESCE(page_size, 20), 1), 100);

  WITH filtered_users AS (
    SELECT app_user.id
    FROM private.app_users app_user
    WHERE (active_filter IS NULL OR app_user.active = active_filter)
      AND (
        normalized_search = ''
        OR lower(app_user.email) LIKE '%' || normalized_search || '%'
        OR lower(app_user.display_name) LIKE '%' || normalized_search || '%'
      )
  )
  SELECT count(*)::integer
  INTO total_items
  FROM filtered_users;

  WITH filtered_users AS (
    SELECT app_user.id, app_user.updated_at, app_user.email
    FROM private.app_users app_user
    WHERE (active_filter IS NULL OR app_user.active = active_filter)
      AND (
        normalized_search = ''
        OR lower(app_user.email) LIKE '%' || normalized_search || '%'
        OR lower(app_user.display_name) LIKE '%' || normalized_search || '%'
      )
    ORDER BY app_user.updated_at DESC, app_user.email ASC
    LIMIT resolved_page_size
    OFFSET (resolved_page - 1) * resolved_page_size
  )
  SELECT COALESCE(jsonb_agg(private.admin_user_json(filtered_users.id)), '[]'::jsonb)
  INTO items
  FROM filtered_users;

  RETURN jsonb_build_object(
    'items', items,
    'page', resolved_page,
    'pageSize', resolved_page_size,
    'totalItems', total_items,
    'totalPages', CEIL(total_items::numeric / resolved_page_size)::integer
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_get_user(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  result jsonb;
BEGIN
  result := private.admin_user_json(user_id);

  IF result IS NULL THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_create_user(
  email text,
  display_name text,
  password text,
  app_roles text[],
  active boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  normalized_email text;
  created_user_id uuid;
BEGIN
  normalized_email := lower(btrim(email));

  IF normalized_email IS NULL OR normalized_email = '' THEN
    RAISE EXCEPTION 'Email is required'
      USING ERRCODE = '22023';
  END IF;

  IF display_name IS NULL OR length(btrim(display_name)) = 0 THEN
    RAISE EXCEPTION 'Display name is required'
      USING ERRCODE = '22023';
  END IF;

  IF password IS NULL OR length(password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters'
      USING ERRCODE = '22023';
  END IF;

  PERFORM private.validate_app_roles(app_roles);

  INSERT INTO private.app_users (
    email,
    display_name,
    password_hash,
    active
  )
  VALUES (
    normalized_email,
    btrim(display_name),
    private.hash_password(password),
    COALESCE(active, true)
  )
  RETURNING id INTO created_user_id;

  PERFORM private.replace_app_user_roles(created_user_id, app_roles);

  RETURN private.admin_user_json(created_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_update_user(
  user_id uuid,
  email text,
  display_name text,
  active boolean,
  app_roles text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_user_id ALIAS FOR $1;
  email_input ALIAS FOR $2;
  display_name_input ALIAS FOR $3;
  active_input ALIAS FOR $4;
  roles_input ALIAS FOR $5;
  normalized_email text;
  previous_active boolean;
BEGIN
  normalized_email := lower(btrim(email_input));

  IF normalized_email IS NULL OR normalized_email = '' THEN
    RAISE EXCEPTION 'Email is required'
      USING ERRCODE = '22023';
  END IF;

  IF display_name_input IS NULL OR length(btrim(display_name_input)) = 0 THEN
    RAISE EXCEPTION 'Display name is required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM private.validate_app_roles(roles_input);

  SELECT app_user.active
  INTO previous_active
  FROM private.app_users app_user
  WHERE app_user.id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE private.app_users
  SET
    email = normalized_email,
    display_name = btrim(display_name_input),
    active = COALESCE(active_input, private.app_users.active)
  WHERE id = target_user_id;

  PERFORM private.replace_app_user_roles(target_user_id, roles_input);

  IF previous_active IS DISTINCT FROM COALESCE(active_input, previous_active)
    OR roles_input IS NOT NULL
  THEN
    PERFORM private.revoke_user_refresh_sessions(target_user_id);
  END IF;

  RETURN private.admin_user_json(target_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_reset_user_password(
  user_id uuid,
  new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF new_password IS NULL OR length(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters'
      USING ERRCODE = '22023';
  END IF;

  UPDATE private.app_users
  SET password_hash = private.hash_password(new_password)
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM private.revoke_user_refresh_sessions(user_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_deactivate_user(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE private.app_users
  SET active = false
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM private.revoke_user_refresh_sessions(user_id);

  RETURN private.admin_user_json(user_id);
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_activate_user(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE private.app_users
  SET active = true
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN private.admin_user_json(user_id);
END;
$$;

REVOKE ALL ON FUNCTION private.validate_app_roles(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.admin_user_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.replace_app_user_roles(uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.revoke_user_refresh_sessions(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION api.admin_list_users(text, boolean, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_get_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_create_user(text, text, text, text[], boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_update_user(uuid, text, text, boolean, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_reset_user_password(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_deactivate_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_activate_user(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION api.admin_list_users(text, boolean, integer, integer) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_get_user(uuid) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_create_user(text, text, text, text[], boolean) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_update_user(uuid, text, text, boolean, text[]) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_reset_user_password(uuid, text) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_deactivate_user(uuid) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_activate_user(uuid) TO erp_admin;

COMMIT;
