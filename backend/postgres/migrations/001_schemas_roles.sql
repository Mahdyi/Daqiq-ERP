BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE SCHEMA IF NOT EXISTS api;
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA api FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_anon') THEN
    CREATE ROLE erp_anon NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_admin') THEN
    CREATE ROLE erp_admin NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_manager') THEN
    CREATE ROLE erp_manager NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_accountant') THEN
    CREATE ROLE erp_accountant NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_sales') THEN
    CREATE ROLE erp_sales NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_warehouse') THEN
    CREATE ROLE erp_warehouse NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_viewer') THEN
    CREATE ROLE erp_viewer NOLOGIN NOINHERIT;
  END IF;
END
$$;

GRANT erp_anon TO authenticator;
GRANT erp_admin TO authenticator;
GRANT erp_manager TO authenticator;
GRANT erp_accountant TO authenticator;
GRANT erp_sales TO authenticator;
GRANT erp_warehouse TO authenticator;
GRANT erp_viewer TO authenticator;

COMMIT;
