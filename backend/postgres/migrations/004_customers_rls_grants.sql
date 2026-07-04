BEGIN;

REVOKE ALL ON SCHEMA api FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

GRANT USAGE ON SCHEMA api TO
  erp_anon,
  erp_admin,
  erp_manager,
  erp_accountant,
  erp_sales,
  erp_warehouse,
  erp_viewer;

REVOKE ALL ON TABLE api.customers FROM
  PUBLIC,
  erp_anon,
  erp_admin,
  erp_manager,
  erp_accountant,
  erp_sales,
  erp_warehouse,
  erp_viewer;

GRANT SELECT ON TABLE api.customers TO
  erp_admin,
  erp_manager,
  erp_sales,
  erp_accountant;

GRANT INSERT, UPDATE ON TABLE api.customers TO
  erp_admin,
  erp_manager,
  erp_sales;

GRANT DELETE ON TABLE api.customers TO
  erp_admin;

ALTER TABLE api.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.customers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customers_select_policy ON api.customers;
DROP POLICY IF EXISTS customers_insert_policy ON api.customers;
DROP POLICY IF EXISTS customers_update_policy ON api.customers;
DROP POLICY IF EXISTS customers_delete_policy ON api.customers;

CREATE POLICY customers_select_policy
ON api.customers
FOR SELECT
TO erp_admin, erp_manager, erp_sales, erp_accountant
USING (true);

CREATE POLICY customers_insert_policy
ON api.customers
FOR INSERT
TO erp_admin, erp_manager, erp_sales
WITH CHECK (true);

CREATE POLICY customers_update_policy
ON api.customers
FOR UPDATE
TO erp_admin, erp_manager, erp_sales
USING (true)
WITH CHECK (true);

CREATE POLICY customers_delete_policy
ON api.customers
FOR DELETE
TO erp_admin
USING (true);

COMMIT;
