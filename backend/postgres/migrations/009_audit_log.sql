BEGIN;

CREATE TABLE IF NOT EXISTS private.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  actor_user_id uuid,
  actor_email text,
  actor_roles text[],
  db_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  outcome text NOT NULL,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  request_id text,
  CONSTRAINT audit_logs_action_not_blank CHECK (length(btrim(action)) > 0),
  CONSTRAINT audit_logs_entity_type_not_blank CHECK (length(btrim(entity_type)) > 0),
  CONSTRAINT audit_logs_summary_not_blank CHECK (length(btrim(summary)) > 0),
  CONSTRAINT audit_logs_outcome_valid CHECK (outcome IN ('success', 'failure', 'blocked'))
);

CREATE INDEX IF NOT EXISTS audit_logs_occurred_at_idx
  ON private.audit_logs (occurred_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx
  ON private.audit_logs (actor_user_id);

CREATE INDEX IF NOT EXISTS audit_logs_action_idx
  ON private.audit_logs (action);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON private.audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS audit_logs_outcome_idx
  ON private.audit_logs (outcome);

REVOKE ALL ON TABLE private.audit_logs FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.sanitize_audit_metadata(metadata jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_object_agg(entry.key, entry.value)
      FROM jsonb_each(COALESCE(metadata, '{}'::jsonb)) entry
      WHERE lower(entry.key) NOT IN (
        'password',
        'new_password',
        'old_password',
        'accesstoken',
        'refreshtoken',
        'token',
        'authorization',
        'password_hash',
        'refresh_token_hash',
        'jwt',
        'secret'
      )
    ),
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION private.request_ip_address()
RETURNS inet
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog
AS $$
DECLARE
  headers jsonb;
  forwarded_for text;
BEGIN
  headers := nullif(current_setting('request.headers', true), '')::jsonb;
  forwarded_for := split_part(headers->>'x-forwarded-for', ',', 1);

  IF forwarded_for IS NULL OR btrim(forwarded_for) = '' THEN
    RETURN NULL;
  END IF;

  RETURN btrim(forwarded_for)::inet;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.write_audit_log(
  audit_action text,
  audit_entity_type text,
  audit_outcome text,
  audit_summary text,
  audit_entity_id text DEFAULT NULL,
  audit_metadata jsonb DEFAULT '{}'::jsonb,
  audit_actor_user_id uuid DEFAULT NULL,
  audit_actor_email text DEFAULT NULL,
  audit_actor_roles text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  claims jsonb;
  headers jsonb;
  resolved_actor_user_id uuid;
  resolved_actor_email text;
  resolved_actor_roles text[];
  resolved_db_role text;
  resolved_user_agent text;
  resolved_request_id text;
BEGIN
  claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  headers := nullif(current_setting('request.headers', true), '')::jsonb;

  resolved_actor_user_id := COALESCE(audit_actor_user_id, NULLIF(claims->>'user_id', '')::uuid);
  resolved_actor_email := COALESCE(audit_actor_email, NULLIF(claims->>'email', ''));
  resolved_actor_roles := COALESCE(
    audit_actor_roles,
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(claims->'app_roles', '[]'::jsonb)))
  );
  resolved_db_role := COALESCE(NULLIF(claims->>'role', ''), current_user);
  resolved_user_agent := NULLIF(headers->>'user-agent', '');
  resolved_request_id := COALESCE(NULLIF(headers->>'x-request-id', ''), NULLIF(headers->>'x-correlation-id', ''));

  INSERT INTO private.audit_logs (
    actor_user_id,
    actor_email,
    actor_roles,
    db_role,
    action,
    entity_type,
    entity_id,
    outcome,
    summary,
    metadata,
    ip_address,
    user_agent,
    request_id
  )
  VALUES (
    resolved_actor_user_id,
    resolved_actor_email,
    resolved_actor_roles,
    resolved_db_role,
    audit_action,
    audit_entity_type,
    audit_entity_id,
    audit_outcome,
    audit_summary,
    private.sanitize_audit_metadata(audit_metadata),
    private.request_ip_address(),
    resolved_user_agent,
    resolved_request_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION private.auth_failure_response(message text DEFAULT 'Invalid credentials')
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM set_config('response.status', '401', true);

  RETURN jsonb_build_object(
    'code', '28P01',
    'message', message
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.audit_log_json(log_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', audit_log.id,
    'occurredAt', audit_log.occurred_at,
    'actorUserId', audit_log.actor_user_id,
    'actorEmail', audit_log.actor_email,
    'actorRoles', COALESCE(to_jsonb(audit_log.actor_roles), '[]'::jsonb),
    'dbRole', audit_log.db_role,
    'action', audit_log.action,
    'entityType', audit_log.entity_type,
    'entityId', audit_log.entity_id,
    'outcome', audit_log.outcome,
    'summary', audit_log.summary,
    'metadata', private.sanitize_audit_metadata(audit_log.metadata),
    'ipAddress', audit_log.ip_address::text,
    'userAgent', audit_log.user_agent,
    'requestId', audit_log.request_id
  )
  FROM private.audit_logs audit_log
  WHERE audit_log.id = log_id;
$$;

CREATE OR REPLACE FUNCTION private.audit_customers_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  changed_customer api.customers%ROWTYPE;
  action_name text;
  summary_text text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    changed_customer := OLD;
  ELSE
    changed_customer := NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    action_name := 'customer.created';
    summary_text := 'Customer created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'customer.updated';
    summary_text := 'Customer updated';
  ELSE
    action_name := 'customer.deleted';
    summary_text := 'Customer deleted';
  END IF;

  PERFORM private.write_audit_log(
    action_name,
    'customer',
    'success',
    summary_text,
    changed_customer.id::text,
    jsonb_build_object(
      'code', changed_customer.code,
      'name', changed_customer.name,
      'active', changed_customer.active,
      'customerType', changed_customer.customer_type
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_customers_insert ON api.customers;
DROP TRIGGER IF EXISTS audit_customers_update ON api.customers;
DROP TRIGGER IF EXISTS audit_customers_delete ON api.customers;

CREATE TRIGGER audit_customers_insert
AFTER INSERT ON api.customers
FOR EACH ROW
EXECUTE FUNCTION private.audit_customers_change();

CREATE TRIGGER audit_customers_update
AFTER UPDATE ON api.customers
FOR EACH ROW
EXECUTE FUNCTION private.audit_customers_change();

CREATE TRIGGER audit_customers_delete
AFTER DELETE ON api.customers
FOR EACH ROW
EXECUTE FUNCTION private.audit_customers_change();

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
  response jsonb;
BEGIN
  normalized_email := lower(btrim(email));

  IF normalized_email IS NULL OR normalized_email = '' OR password IS NULL THEN
    PERFORM private.write_audit_log(
      'auth.login.failure',
      'auth',
      'failure',
      'Login failed',
      NULL,
      jsonb_build_object('email', normalized_email)
    );
    RETURN private.auth_failure_response('Invalid email or password');
  END IF;

  SELECT *
  INTO matched_user
  FROM private.app_users app_user
  WHERE lower(btrim(app_user.email)) = normalized_email
    AND app_user.active = true
  LIMIT 1;

  IF NOT FOUND OR NOT private.verify_password(password, matched_user.password_hash) THEN
    PERFORM private.write_audit_log(
      'auth.login.failure',
      'auth',
      'failure',
      'Login failed',
      NULL,
      jsonb_build_object('email', normalized_email)
    );
    RETURN private.auth_failure_response('Invalid email or password');
  END IF;

  app_roles := private.get_user_app_roles(matched_user.id);

  IF app_roles IS NULL OR array_length(app_roles, 1) IS NULL THEN
    PERFORM private.write_audit_log(
      'auth.login.failure',
      'auth',
      'failure',
      'Login failed',
      matched_user.id::text,
      jsonb_build_object('email', normalized_email),
      matched_user.id,
      matched_user.email,
      ARRAY[]::text[]
    );
    RETURN private.auth_failure_response('Invalid email or password');
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

  response := private.build_auth_response(
    matched_user,
    app_roles,
    refresh_token,
    access_expires_at
  );

  PERFORM private.write_audit_log(
    'auth.login.success',
    'auth',
    'success',
    'Login succeeded',
    matched_user.id::text,
    jsonb_build_object('email', matched_user.email),
    matched_user.id,
    matched_user.email,
    app_roles
  );

  RETURN response;
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
  failure_action text := 'auth.refresh.failure';
BEGIN
  IF refresh_token IS NULL OR length(btrim(refresh_token)) = 0 THEN
    PERFORM private.write_audit_log('auth.refresh.failure', 'auth', 'failure', 'Refresh failed');
    RETURN private.auth_failure_response('Invalid refresh token');
  END IF;

  token_hash := private.hash_refresh_token(refresh_token);

  SELECT *
  INTO existing_session
  FROM private.auth_refresh_sessions session
  WHERE session.refresh_token_hash = token_hash
  LIMIT 1;

  IF NOT FOUND THEN
    PERFORM private.write_audit_log('auth.refresh.failure', 'auth', 'failure', 'Refresh failed');
    RETURN private.auth_failure_response('Invalid refresh token');
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

    PERFORM private.write_audit_log(
      'auth.refresh.reuse_detected',
      'auth',
      'blocked',
      'Refresh token reuse detected',
      existing_session.user_id::text,
      jsonb_build_object('familyId', existing_session.family_id, 'sessionId', existing_session.id)
    );

    RETURN private.auth_failure_response('Invalid refresh token');
  END IF;

  IF existing_session.revoked_at IS NOT NULL THEN
    failure_action := 'auth.refresh.revoked_attempt';
  ELSIF existing_session.expires_at <= statement_timestamp() THEN
    failure_action := 'auth.refresh.expired_attempt';
  END IF;

  IF
    existing_session.revoked_at IS NOT NULL OR
    existing_session.expires_at <= statement_timestamp()
  THEN
    PERFORM private.write_audit_log(
      failure_action,
      'auth',
      'failure',
      'Refresh failed',
      existing_session.user_id::text,
      jsonb_build_object('familyId', existing_session.family_id)
    );
    RETURN private.auth_failure_response('Invalid refresh token');
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

    PERFORM private.write_audit_log(
      'auth.refresh.failure',
      'auth',
      'failure',
      'Refresh failed',
      existing_session.user_id::text,
      jsonb_build_object('reason', 'inactive-user')
    );
    RETURN private.auth_failure_response('Invalid refresh token');
  END IF;

  app_roles := private.get_user_app_roles(matched_user.id);

  IF app_roles IS NULL OR array_length(app_roles, 1) IS NULL THEN
    UPDATE private.auth_refresh_sessions
    SET revoked_at = COALESCE(revoked_at, statement_timestamp())
    WHERE family_id = existing_session.family_id;

    PERFORM private.write_audit_log(
      'auth.refresh.failure',
      'auth',
      'failure',
      'Refresh failed',
      matched_user.id::text,
      jsonb_build_object('reason', 'missing-roles'),
      matched_user.id,
      matched_user.email,
      ARRAY[]::text[]
    );
    RETURN private.auth_failure_response('Invalid refresh token');
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

  PERFORM private.write_audit_log(
    'auth.refresh.success',
    'auth',
    'success',
    'Refresh succeeded',
    matched_user.id::text,
    jsonb_build_object('familyId', existing_session.family_id),
    matched_user.id,
    matched_user.email,
    app_roles
  );

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
  matched_session private.auth_refresh_sessions%ROWTYPE;
BEGIN
  IF refresh_token IS NOT NULL AND length(btrim(refresh_token)) > 0 THEN
    token_hash := private.hash_refresh_token(refresh_token);

    SELECT *
    INTO matched_session
    FROM private.auth_refresh_sessions
    WHERE refresh_token_hash = token_hash
    LIMIT 1;

    UPDATE private.auth_refresh_sessions
    SET revoked_at = COALESCE(revoked_at, statement_timestamp())
    WHERE refresh_token_hash = token_hash
      AND revoked_at IS NULL;
  END IF;

  PERFORM private.write_audit_log(
    'auth.logout',
    'auth',
    'success',
    'Logout requested',
    CASE WHEN matched_session.id IS NULL THEN NULL ELSE matched_session.user_id::text END,
    jsonb_build_object('sessionMatched', matched_session.id IS NOT NULL)
  );

  RETURN jsonb_build_object('success', true);
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
  result jsonb;
  normalized_roles text[];
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

  normalized_roles := private.validate_app_roles(app_roles);

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

  PERFORM private.replace_app_user_roles(created_user_id, normalized_roles);
  result := private.admin_user_json(created_user_id);

  PERFORM private.write_audit_log(
    'user.created',
    'user',
    'success',
    'User created',
    created_user_id::text,
    jsonb_build_object('email', normalized_email, 'roles', normalized_roles, 'active', COALESCE(active, true))
  );

  RETURN result;
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
  previous_roles text[];
  normalized_roles text[];
  revoked_count integer := 0;
  result jsonb;
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

  normalized_roles := private.validate_app_roles(roles_input);

  SELECT app_user.active, private.get_user_app_roles(app_user.id)
  INTO previous_active, previous_roles
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

  PERFORM private.replace_app_user_roles(target_user_id, normalized_roles);

  IF previous_active IS DISTINCT FROM COALESCE(active_input, previous_active)
    OR previous_roles IS DISTINCT FROM normalized_roles
  THEN
    revoked_count := private.revoke_user_refresh_sessions(target_user_id);
  END IF;

  result := private.admin_user_json(target_user_id);

  PERFORM private.write_audit_log(
    'user.updated',
    'user',
    'success',
    'User updated',
    target_user_id::text,
    jsonb_build_object(
      'email', normalized_email,
      'oldRoles', previous_roles,
      'newRoles', normalized_roles,
      'rolesChanged', previous_roles IS DISTINCT FROM normalized_roles,
      'oldActive', previous_active,
      'newActive', COALESCE(active_input, previous_active),
      'revokedSessions', revoked_count
    )
  );

  IF previous_roles IS DISTINCT FROM normalized_roles THEN
    PERFORM private.write_audit_log(
      'user.roles_changed',
      'user',
      'success',
      'User roles changed',
      target_user_id::text,
      jsonb_build_object('oldRoles', previous_roles, 'newRoles', normalized_roles)
    );
  END IF;

  RETURN result;
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
DECLARE
  revoked_count integer;
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

  revoked_count := private.revoke_user_refresh_sessions(user_id);

  PERFORM private.write_audit_log(
    'user.password_reset',
    'user',
    'success',
    'User password reset',
    user_id::text,
    jsonb_build_object('revokedSessions', revoked_count)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_deactivate_user(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  revoked_count integer;
  result jsonb;
BEGIN
  UPDATE private.app_users
  SET active = false
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = 'P0002';
  END IF;

  revoked_count := private.revoke_user_refresh_sessions(user_id);
  result := private.admin_user_json(user_id);

  PERFORM private.write_audit_log(
    'user.deactivated',
    'user',
    'success',
    'User deactivated',
    user_id::text,
    jsonb_build_object('revokedSessions', revoked_count)
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_activate_user(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE private.app_users
  SET active = true
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = 'P0002';
  END IF;

  result := private.admin_user_json(user_id);

  PERFORM private.write_audit_log(
    'user.activated',
    'user',
    'success',
    'User activated',
    user_id::text
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_list_audit_logs(
  search text DEFAULT NULL,
  actor_user_id uuid DEFAULT NULL,
  action text DEFAULT NULL,
  entity_type text DEFAULT NULL,
  outcome text DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
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
  actor_filter ALIAS FOR $2;
  action_filter ALIAS FOR $3;
  entity_type_filter ALIAS FOR $4;
  outcome_filter ALIAS FOR $5;
  normalized_search text;
  resolved_page integer;
  resolved_page_size integer;
  total_items integer;
  items jsonb;
BEGIN
  normalized_search := lower(btrim(COALESCE(search, '')));
  resolved_page := GREATEST(COALESCE(page_number, 1), 1);
  resolved_page_size := LEAST(GREATEST(COALESCE(page_size, 20), 1), 100);

  WITH filtered_logs AS (
    SELECT audit_log.id
    FROM private.audit_logs audit_log
    WHERE (actor_filter IS NULL OR audit_log.actor_user_id = actor_filter)
      AND (action_filter IS NULL OR audit_log.action = action_filter)
      AND (entity_type_filter IS NULL OR audit_log.entity_type = entity_type_filter)
      AND (outcome_filter IS NULL OR audit_log.outcome = outcome_filter)
      AND (date_from IS NULL OR audit_log.occurred_at >= date_from)
      AND (date_to IS NULL OR audit_log.occurred_at <= date_to)
      AND (
        normalized_search = ''
        OR lower(COALESCE(audit_log.actor_email, '')) LIKE '%' || normalized_search || '%'
        OR lower(audit_log.action) LIKE '%' || normalized_search || '%'
        OR lower(audit_log.entity_type) LIKE '%' || normalized_search || '%'
        OR lower(COALESCE(audit_log.entity_id, '')) LIKE '%' || normalized_search || '%'
        OR lower(audit_log.summary) LIKE '%' || normalized_search || '%'
      )
  )
  SELECT count(*)::integer
  INTO total_items
  FROM filtered_logs;

  WITH filtered_logs AS (
    SELECT audit_log.id, audit_log.occurred_at
    FROM private.audit_logs audit_log
    WHERE (actor_filter IS NULL OR audit_log.actor_user_id = actor_filter)
      AND (action_filter IS NULL OR audit_log.action = action_filter)
      AND (entity_type_filter IS NULL OR audit_log.entity_type = entity_type_filter)
      AND (outcome_filter IS NULL OR audit_log.outcome = outcome_filter)
      AND (date_from IS NULL OR audit_log.occurred_at >= date_from)
      AND (date_to IS NULL OR audit_log.occurred_at <= date_to)
      AND (
        normalized_search = ''
        OR lower(COALESCE(audit_log.actor_email, '')) LIKE '%' || normalized_search || '%'
        OR lower(audit_log.action) LIKE '%' || normalized_search || '%'
        OR lower(audit_log.entity_type) LIKE '%' || normalized_search || '%'
        OR lower(COALESCE(audit_log.entity_id, '')) LIKE '%' || normalized_search || '%'
        OR lower(audit_log.summary) LIKE '%' || normalized_search || '%'
      )
    ORDER BY audit_log.occurred_at DESC, audit_log.id DESC
    LIMIT resolved_page_size
    OFFSET (resolved_page - 1) * resolved_page_size
  )
  SELECT COALESCE(jsonb_agg(private.audit_log_json(filtered_logs.id)), '[]'::jsonb)
  INTO items
  FROM filtered_logs;

  RETURN jsonb_build_object(
    'items', items,
    'page', resolved_page,
    'pageSize', resolved_page_size,
    'totalItems', total_items,
    'totalPages', CEIL(total_items::numeric / resolved_page_size)::integer
  );
END;
$$;

CREATE OR REPLACE FUNCTION api.admin_get_audit_log(log_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  result jsonb;
BEGIN
  result := private.audit_log_json(log_id);

  IF result IS NULL THEN
    RAISE EXCEPTION 'Audit log not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION private.sanitize_audit_metadata(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.request_ip_address() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.write_audit_log(text, text, text, text, text, jsonb, uuid, text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_failure_response(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_log_json(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_customers_change() FROM PUBLIC;

REVOKE ALL ON FUNCTION api.admin_list_audit_logs(
  text,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  integer,
  integer
) FROM PUBLIC;
REVOKE ALL ON FUNCTION api.admin_get_audit_log(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION api.admin_list_audit_logs(
  text,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  integer,
  integer
) TO erp_admin;
GRANT EXECUTE ON FUNCTION api.admin_get_audit_log(uuid) TO erp_admin;

COMMIT;
