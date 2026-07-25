BEGIN;

CREATE TABLE IF NOT EXISTS private.auth_refresh_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES private.app_users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  family_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  expires_at timestamptz NOT NULL,
  rotated_at timestamptz,
  revoked_at timestamptz,
  replaced_by_session_id uuid REFERENCES private.auth_refresh_sessions(id),
  user_agent text,
  ip_address inet,
  reuse_detected_at timestamptz,
  CONSTRAINT auth_refresh_sessions_hash_not_blank CHECK (
    length(btrim(refresh_token_hash)) > 0
  ),
  CONSTRAINT auth_refresh_sessions_expiry_valid CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS auth_refresh_sessions_hash_idx
  ON private.auth_refresh_sessions (refresh_token_hash);

CREATE INDEX IF NOT EXISTS auth_refresh_sessions_family_idx
  ON private.auth_refresh_sessions (family_id);

CREATE INDEX IF NOT EXISTS auth_refresh_sessions_user_idx
  ON private.auth_refresh_sessions (user_id);

REVOKE ALL ON TABLE private.auth_refresh_sessions FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.generate_refresh_token()
RETURNS text
LANGUAGE sql
VOLATILE
STRICT
SET search_path = pg_catalog, public
AS $$
  SELECT private.base64url(public.gen_random_bytes(48));
$$;

CREATE OR REPLACE FUNCTION private.hash_refresh_token(token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = pg_catalog, public
AS $$
  SELECT encode(public.digest(token, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION private.verify_refresh_token(token text, token_hash text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = pg_catalog
AS $$
  SELECT private.hash_refresh_token(token) = token_hash;
$$;

CREATE OR REPLACE FUNCTION private.get_user_app_roles(target_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
STRICT
SET search_path = pg_catalog
AS $$
  SELECT array_agg(role_row.app_role ORDER BY role_row.role_rank)
  FROM (
    SELECT
      user_role.app_role,
      CASE user_role.app_role
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'sales' THEN 3
        WHEN 'accountant' THEN 4
        WHEN 'warehouse' THEN 5
        WHEN 'viewer' THEN 6
        ELSE 100
      END AS role_rank
    FROM private.app_user_roles user_role
    WHERE user_role.user_id = target_user_id
  ) role_row;
$$;

CREATE OR REPLACE FUNCTION private.build_auth_response(
  matched_user private.app_users,
  app_roles text[],
  refresh_token text,
  expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected_app_role text;
  selected_db_role text;
  token_payload jsonb;
BEGIN
  IF app_roles IS NULL OR array_length(app_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  selected_app_role := app_roles[1];
  selected_db_role := private.map_app_role_to_db_role(selected_app_role);

  IF selected_db_role IS NULL THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  token_payload := jsonb_build_object(
    'role', selected_db_role,
    'user_id', matched_user.id::text,
    'email', matched_user.email,
    'display_name', matched_user.display_name,
    'app_roles', to_jsonb(app_roles),
    'exp', floor(extract(epoch from expires_at))::bigint
  );

  RETURN jsonb_build_object(
    'accessToken', private.jwt_sign(token_payload),
    'refreshToken', refresh_token,
    'tokenType', 'Bearer',
    'expiresAt', expires_at,
    'user', jsonb_build_object(
      'id', matched_user.id,
      'email', matched_user.email,
      'displayName', matched_user.display_name,
      'roles', to_jsonb(app_roles)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.login(email text, password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  normalized_email text;
  matched_user private.app_users%ROWTYPE;
  app_roles text[];
  access_expires_at timestamptz;
  refresh_expires_at timestamptz;
  refresh_token text;
  refresh_family_id uuid;
BEGIN
  normalized_email := lower(btrim(email));

  IF normalized_email IS NULL OR normalized_email = '' OR password IS NULL THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  SELECT *
  INTO matched_user
  FROM private.app_users app_user
  WHERE lower(btrim(app_user.email)) = normalized_email
    AND app_user.active = true
  LIMIT 1;

  IF NOT FOUND OR NOT private.verify_password(password, matched_user.password_hash) THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  app_roles := private.get_user_app_roles(matched_user.id);

  IF app_roles IS NULL OR array_length(app_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'Invalid email or password'
      USING ERRCODE = '28P01';
  END IF;

  access_expires_at := statement_timestamp() + interval '60 minutes';
  refresh_expires_at := statement_timestamp() + interval '7 days';
  refresh_token := private.generate_refresh_token();
  refresh_family_id := gen_random_uuid();

  INSERT INTO private.auth_refresh_sessions (
    user_id,
    refresh_token_hash,
    family_id,
    expires_at
  )
  VALUES (
    matched_user.id,
    private.hash_refresh_token(refresh_token),
    refresh_family_id,
    refresh_expires_at
  );

  UPDATE private.app_users
  SET last_login_at = statement_timestamp()
  WHERE id = matched_user.id;

  RETURN private.build_auth_response(
    matched_user,
    app_roles,
    refresh_token,
    access_expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.refresh_session(refresh_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  token_hash text;
  existing_session private.auth_refresh_sessions%ROWTYPE;
  matched_user private.app_users%ROWTYPE;
  app_roles text[];
  access_expires_at timestamptz;
  refresh_expires_at timestamptz;
  new_refresh_token text;
  new_session_id uuid;
BEGIN
  IF refresh_token IS NULL OR length(btrim(refresh_token)) = 0 THEN
    RAISE EXCEPTION 'Invalid refresh token'
      USING ERRCODE = '28P01';
  END IF;

  token_hash := private.hash_refresh_token(refresh_token);

  SELECT *
  INTO existing_session
  FROM private.auth_refresh_sessions session
  WHERE session.refresh_token_hash = token_hash
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid refresh token'
      USING ERRCODE = '28P01';
  END IF;

  IF existing_session.rotated_at IS NOT NULL THEN
    UPDATE private.auth_refresh_sessions
    SET
      revoked_at = COALESCE(revoked_at, statement_timestamp()),
      reuse_detected_at = CASE
        WHEN id = existing_session.id THEN statement_timestamp()
        ELSE reuse_detected_at
      END
    WHERE family_id = existing_session.family_id;

    RAISE EXCEPTION 'Invalid refresh token'
      USING ERRCODE = '28P01';
  END IF;

  IF
    existing_session.revoked_at IS NOT NULL OR
    existing_session.expires_at <= statement_timestamp()
  THEN
    RAISE EXCEPTION 'Invalid refresh token'
      USING ERRCODE = '28P01';
  END IF;

  SELECT *
  INTO matched_user
  FROM private.app_users app_user
  WHERE app_user.id = existing_session.user_id
    AND app_user.active = true
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE private.auth_refresh_sessions
    SET revoked_at = COALESCE(revoked_at, statement_timestamp())
    WHERE family_id = existing_session.family_id;

    RAISE EXCEPTION 'Invalid refresh token'
      USING ERRCODE = '28P01';
  END IF;

  app_roles := private.get_user_app_roles(matched_user.id);

  IF app_roles IS NULL OR array_length(app_roles, 1) IS NULL THEN
    UPDATE private.auth_refresh_sessions
    SET revoked_at = COALESCE(revoked_at, statement_timestamp())
    WHERE family_id = existing_session.family_id;

    RAISE EXCEPTION 'Invalid refresh token'
      USING ERRCODE = '28P01';
  END IF;

  access_expires_at := statement_timestamp() + interval '60 minutes';
  refresh_expires_at := statement_timestamp() + interval '7 days';
  new_refresh_token := private.generate_refresh_token();
  new_session_id := gen_random_uuid();

  INSERT INTO private.auth_refresh_sessions (
    id,
    user_id,
    refresh_token_hash,
    family_id,
    expires_at
  )
  VALUES (
    new_session_id,
    matched_user.id,
    private.hash_refresh_token(new_refresh_token),
    existing_session.family_id,
    refresh_expires_at
  );

  UPDATE private.auth_refresh_sessions
  SET
    rotated_at = statement_timestamp(),
    replaced_by_session_id = new_session_id
  WHERE id = existing_session.id;

  RETURN private.build_auth_response(
    matched_user,
    app_roles,
    new_refresh_token,
    access_expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.logout(refresh_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  token_hash text;
BEGIN
  IF refresh_token IS NOT NULL AND length(btrim(refresh_token)) > 0 THEN
    token_hash := private.hash_refresh_token(refresh_token);

    UPDATE private.auth_refresh_sessions
    SET revoked_at = COALESCE(revoked_at, statement_timestamp())
    WHERE refresh_token_hash = token_hash
      AND revoked_at IS NULL;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION private.cleanup_expired_refresh_sessions()
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
  WHERE expires_at <= statement_timestamp()
    AND revoked_at IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

REVOKE ALL ON FUNCTION private.generate_refresh_token() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.hash_refresh_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.verify_refresh_token(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.get_user_app_roles(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.build_auth_response(
  private.app_users,
  text[],
  text,
  timestamptz
) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.cleanup_expired_refresh_sessions() FROM PUBLIC;

REVOKE ALL ON FUNCTION api.login(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.refresh_session(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.logout(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION api.login(text, text) TO erp_anon;
GRANT EXECUTE ON FUNCTION api.refresh_session(text) TO erp_anon;
GRANT EXECUTE ON FUNCTION api.logout(text) TO erp_anon;

COMMIT;
