---
title: "Your first Entra ID policies with Terraform: Named Location and Conditional Access Policy"
description: "Create a named location and a report-only Conditional Access policy, deploy them through GitHub Actions, or import existing Entra configuration."
draft: true
date: 2026-09-25
topics: ["entra-id", "terraform", "github-actions", "security"]
---

## Bring existing Entra configuration into Terraform

[Import existing resources](https://developer.hashicorp.com/terraform/language/import)

Use this path instead of creating replacements when your named location and policy already exist. Import connects an existing object's ID to a Terraform resource address in state.

There are three separate tasks: retrieve the live configuration, describe it in Terraform, and apply an import plan. Downloading JSON (JavaScript Object Notation) completes only the first task.

### Retrieve the objects with Azure CLI

[Microsoft Graph named locations endpoint](https://learn.microsoft.com/en-us/graph/api/conditionalaccessroot-list-namedlocations?view=graph-rest-1.0)

Use Azure CLI (command-line interface) with an account authorised to read Conditional Access configuration. Replace `<TENANT_ID>` with your tenant ID:

```bash
az login --tenant "<TENANT_ID>" --allow-no-subscriptions
```

List the named locations and policies:

```bash
az rest \
  --method GET \
  --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/namedLocations" \
  --query "value[].{name:displayName,id:id}" \
  --output table

az rest \
  --method GET \
  --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" \
  --query "value[].{name:displayName,id:id,state:state}" \
  --output table
```

The second request uses the [Conditional Access policies endpoint](https://learn.microsoft.com/en-us/graph/api/conditionalaccessroot-list-policies?view=graph-rest-1.0). Successful Azure CLI login alone does not guarantee Microsoft Graph access.

For larger collections, inspect the unfiltered JSON and follow any `@odata.nextLink`. The table commands show only the returned page.

Select the two objects and replace `<LOCATION_ID>` and `<POLICY_ID>` with their IDs. Run these exports from a private working directory outside the repository:

```bash
az rest \
  --method GET \
  --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/namedLocations/<LOCATION_ID>" \
  --output json > named-location.json

az rest \
  --method GET \
  --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<POLICY_ID>" \
  --output json > conditional-access-policy.json
```

> Treat the exports as tenant configuration data. Keep them outside the Terraform folder and out of public commits.

### Translate the JSON into Terraform

Microsoft Graph response fields differ from the provider's arguments and nested blocks. For example, a country-based location might return these fields:

```json
{
  "@odata.type": "#microsoft.graph.countryNamedLocation",
  "displayName": "UK sign-in location",
  "countriesAndRegions": ["GB"],
  "includeUnknownCountriesAndRegions": false,
  "countryLookupMethod": "clientIpAddress"
}
```

The corresponding declaration in `named-locations.tf` is:

```hcl
resource "azuread_named_location" "uk" {
  display_name = "UK sign-in location"

  country {
    countries_and_regions                 = ["GB"]
    include_unknown_countries_and_regions = false
    country_lookup_method                 = "clientIpAddress"
  }
}
```

Use this declaration instead of the new-location example, keeping the actual exported values. An IP-based location needs an `ip` block instead; consult the [named location schema](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/named_location).

Map the policy's exported fields into its resource in `conditional-access.tf`:

| Microsoft Graph JSON | Terraform |
| --- | --- |
| `displayName` | `display_name` |
| `state` | `state` |
| `conditions.clientAppTypes` | `conditions.client_app_types` |
| `conditions.users.includeUsers` | `conditions.users.included_users` |
| `conditions.users.excludeGroups` | `conditions.users.excluded_groups` |
| `conditions.applications.includeApplications` | `conditions.applications.included_applications` |
| `conditions.locations.includeLocations` | `conditions.locations.included_locations` |
| `conditions.locations.excludeLocations` | `conditions.locations.excluded_locations` |
| `grantControls.builtInControls` | `grant_controls.built_in_controls` |

This table is a starting point, not a complete converter. Preserve every condition, exclusion, grant control, and session control using the [policy schema](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/conditional_access_policy).

Replace the matching location GUID (globally unique identifier) with `azuread_named_location.uk.object_id`. Preserve other location exclusions.

Do not copy response metadata, timestamps, or read-only IDs into configurable resource arguments. Resolve any setting the provider cannot represent before applying.

### Declare the imports

Add this block alongside the location resource in `named-locations.tf`:

```hcl
import {
  to = azuread_named_location.uk
  id = "/identity/conditionalAccess/namedLocations/<LOCATION_ID>"
}
```

Add this block alongside the policy resource in `conditional-access.tf`:

```hcl
import {
  to = azuread_conditional_access_policy.ca_1050_block_outside_approved_countries
  id = "/identity/conditionalAccess/policies/<POLICY_ID>"
}
```

Replace the placeholders with the exported IDs. The `to` addresses must match your resource labels exactly.

These identifiers use the provider's documented path format, rather than just the object GUID. Check that neither object already belongs to another Terraform state.

### Optionally generate the initial configuration

[Generate configuration for imports](https://developer.hashicorp.com/terraform/language/import/generating-configuration)

Instead of translating JSON manually, start with the import blocks and leave their target resource blocks undefined. From an initialised Terraform directory with working provider authentication, run:

```bash
terraform plan -generate-config-out=generated-imports.tf
```

Terraform reads the live objects and writes candidate declarations. It does not convert the downloaded JSON; use the exports to check its output.

1. Choose an output filename that does not already exist.
2. Review the generated arguments against the live configuration.
3. Move the resources into their respective files and remove the now-empty generated file.
4. Replace matching literal IDs with resource references.

Generated configuration needs review before use.

> **Authentication:** `az login` authenticates the export commands. The repository's Terraform providers explicitly use OIDC. Local generation needs a separately configured authentication path or an appropriately authenticated workflow.

### Keep adoption separate from policy changes

For these two existing objects, aim for:

```text
Plan: 2 to import, 0 to add, 0 to change, 0 to destroy.
```

Investigate proposed updates, replacements, or deletions. Applying an import plan can also apply configuration changes included in that plan.

> Preserve the existing policy state during adoption. An enabled policy must not silently become report-only because the new-policy example uses that setting.

Keep adoption and policy changes in separate pull requests. Preserve emergency-access exclusions; if they are missing, record a separate remediation rather than hiding it inside the import.

After applying through your normal deployment process, run another plan to confirm no outstanding changes. The import blocks can remain as a record of adoption.

The checkpoint is straightforward: the original objects retain their IDs and behaviour, and Terraform now tracks them in state.
