# Settings, Lookups, and Feature Flags PostgREST Contract

This contract defines the ERP configuration foundation exposed through the approved `api` schema. Private helpers and audit tables remain in `private`.

## Security Boundary

- Anonymous users have no configuration access.
- `erp_admin` can read and mutate settings, lookup values, and feature flags through approved RPCs.
- `erp_manager` can read settings, lookups, and feature flags but cannot mutate them.
- Other ERP roles have no configuration access in this step.
- Secrets must not be stored in system settings, lookup metadata, or feature flag keys.
- Configuration mutations write audit events through `private.write_audit_log`.

## System Settings

Read settings:

```http
POST /rpc/admin_list_system_settings
```

Request:

```json
{
  "search": "company",
  "category": "company",
  "active": true,
  "page_number": 1,
  "page_size": 20
}
```

Get one setting:

```http
POST /rpc/admin_get_system_setting
```

Request:

```json
{
  "setting_key": "company.defaultCurrency"
}
```

Update editable setting:

```http
POST /rpc/admin_update_system_setting
```

Request:

```json
{
  "setting_key": "ui.defaultPageSize",
  "setting_value": 25
}
```

Rules:

- `editable = false` settings cannot be changed through the public RPC.
- `setting_value` must match `value_type`.
- Secret-like keys or values are rejected by database constraints/functions.

## Lookups

List lookup types:

```http
POST /rpc/admin_list_lookup_types
```

List values for a type:

```http
POST /rpc/admin_list_lookup_values
```

Request:

```json
{
  "lookup_type_code": "unit",
  "search": "kg",
  "active": true,
  "page_number": 1,
  "page_size": 20
}
```

Create value:

```http
POST /rpc/admin_create_lookup_value
```

Update value:

```http
POST /rpc/admin_update_lookup_value
```

Activate/deactivate value:

```http
POST /rpc/admin_set_lookup_value_active
```

Lookup values are not physically deleted in this step. Admin UI performs activation/deactivation only.

## Feature Flags

List flags:

```http
POST /rpc/admin_list_feature_flags
```

Update enabled state:

```http
POST /rpc/admin_update_feature_flag
```

Request:

```json
{
  "flag_key": "products.enabled",
  "enabled": true
}
```

Feature flags are availability switches. They do not replace authorization checks and do not delete data.

## Response Shape

List RPCs return a page object:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

Mutation RPCs return the updated safe row as JSON. Passwords, tokens, JWT secrets, and credential material must never be stored or returned by this configuration API.
