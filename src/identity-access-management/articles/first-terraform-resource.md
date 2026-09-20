---
title: "Your first Entra ID policies with Terraform: named locations and Conditional Access"
description: "Create a named location and a report-only Conditional Access policy, deploy them through GitHub Actions, or import existing Entra configuration."
draft: true
date: 2026-09-13
topics: ["entra-id", "terraform", "github-actions", "security"]
---

## Start with two Entra resources

[Entra ID as Code repository](https://github.com/johnnolan/entra-id-as-code)

Connecting GitHub Actions to Microsoft Entra ID gives a workflow permission to act. The next question is what that workflow should change.

I have kept this example to two resources: a named location and a Conditional Access policy that references it. That makes the relationship visible in the code, the Terraform plan, and the Entra portal.

The policy reports sign-ins that would be blocked outside the United Kingdom. It stays in report-only mode while you check its scope and results.

## Introduction

[Connect GitHub Actions to Entra ID with OIDC](/identity-access-management/articles/github-actions-entra-oidc/)

The previous article establishes OIDC (OpenID Connect) authentication, which lets GitHub Actions use short-lived tokens instead of a stored client secret. It also covers Microsoft Graph permissions, remote state access, and the GitHub deployment environment.

This article uses that connection to manage configuration. Terraform describes the intended resources, shows proposed changes in a plan, and creates them during an apply.

You will create `named-locations.tf` and `conditional-access.tf`, review their plan, deploy through GitHub, and inspect the result in Entra. There is also an alternative path for importing objects you already manage through the portal.

> This example teaches the deployment workflow. A geographic block policy in report-only mode does not provide a complete security baseline.

## Check the tenant and supporting setup

[Federated credentials setup runbook](https://github.com/johnnolan/entra-id-as-code/blob/main/docs/runbooks/setup-federated-credentials.md)

Before adding resources, confirm that you have:

- Completed the previous GitHub-to-Entra setup, including its Terraform preparation steps.
- A test tenant, the Entra directory where you will create these objects.
- Working Terraform provider configuration, remote state, and GitHub plan and apply workflows.
- Tested emergency-access accounts and an existing group containing them.
- Reviewed the tenant's existing Conditional Access policies and Security Defaults configuration.

A Terraform provider translates resource declarations into service requests. Remote state records which Entra objects those declarations manage, using the shared backend storage configured in the previous article.

> **Licensing:** Conditional Access requires Microsoft Entra ID P1 or an entitlement that includes it. Check Microsoft's [licence requirements](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview#license-requirements) for the users in scope.
>
> **Security Defaults:** Use a tenant already prepared for Conditional Access. Do not disable Security Defaults just to run this example; it does not replace those protections. Follow Microsoft's [transition guidance](https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults) when planning that change.

These are the first two **resource files** in this walkthrough. Supporting files such as `main.tf` and `variables.tf` still need to exist.

Use a minimal starter configuration with its own state key. The source repository contains a broader baseline, including enforced policies. Copying its entire Terraform directory changes the scope of this exercise.

If you already manage resources in that directory, keep their declarations and state intact. Removing their files can make Terraform propose deleting the corresponding tenant objects.

## Prepare the folder and automation permissions

[Reusable Terraform workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-run.yml)

1. Create a feature branch in your prepared starter repository.
2. Confirm that its `terraform` directory contains the provider, backend, and input variable configuration.
3. Check that both plan and apply run from that directory.
4. Confirm the automation identity's Microsoft Graph application permissions and administrator consent.

For example, create the branch from the repository root:

```bash
git switch -c feature/first-entra-policy
```

The working folder will contain:

```text
terraform/
├── main.tf                 # Existing provider and backend configuration
├── variables.tf            # Existing supporting inputs
├── .terraform.lock.hcl     # Reviewed provider versions
├── named-locations.tf      # New location resource
└── conditional-access.tf   # New policy and its exclusion-group input
```

Terraform reads the `.tf` files in a directory together. Their names organise the configuration; they do not determine deployment order.

The repository's reusable workflow sets `working-directory: terraform`. Keep your starter workflow aligned with the folder containing these resources.

> **Permissions:** The provider documents `Policy.Read.All` and `Policy.ReadWrite.ConditionalAccess` for these resources when using a service principal, the application's tenant identity. Grant administrator consent after adding permissions.

See the provider documentation for [named locations](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/named_location) and [Conditional Access policies](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/conditional_access_policy).

The repository also lists `Application.Read.All` for its application-scoped policies. Include it when following that repository's permission setup.

Microsoft Graph is the API (application programming interface) used to manage these Entra objects. Its permissions are separate from Azure permissions for the state storage account.

## Create the named location

[Named location resource](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/named_location)

1. Create `terraform/named-locations.tf`.
2. Add the following resource.
3. Keep the country list and unknown-country setting visible during review.

```hcl
resource "azuread_named_location" "uk" {
  display_name = "Example - UK sign-in location"

  country {
    countries_and_regions                 = ["GB"]
    include_unknown_countries_and_regions = false
    country_lookup_method                 = "clientIpAddress"
  }
}
```

The resource label, `uk`, identifies this declaration within Terraform. The `display_name` identifies it in the Entra portal. `GB` is the two-letter country code for the United Kingdom.

Setting `country_lookup_method` to `clientIpAddress` uses the public IP (Internet Protocol) address to determine the sign-in's country. Unknown countries remain outside this location because `include_unknown_countries_and_regions` is `false`.

Creating the location does not restrict access. The policy determines how to use it.

A VPN (virtual private network) or proxy can change the public address Entra sees. Geolocation accuracy also affects the result; a country is not proof that a sign-in is trustworthy. Microsoft's [network guidance](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-assignment-network) explains how these signals work.

## Create the report-only policy

[Conditional Access policy resource](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/conditional_access_policy)

Conditional Access evaluates sign-in conditions and applies access controls when those conditions match. This example includes all users and applications, then excludes the emergency-access group and the UK location.

1. Create `terraform/conditional-access.tf`.
2. Add the input variable and policy below.
3. Supply the existing emergency-access group's object ID to both plan and apply.

```hcl
variable "emergency_access_group_id" {
  description = "Object ID of the existing emergency-access exclusion group."
  type        = string
  nullable    = false

  validation {
    condition = can(regex(
      "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
      var.emergency_access_group_id
    ))
    error_message = "Provide the existing emergency-access group's object ID."
  }
}

resource "azuread_conditional_access_policy" "ca_1050_block_outside_approved_countries" {
  display_name = "GLOBAL - 1050 - BLOCK - Outside approved countries"
  state        = "enabledForReportingButNotEnforced"

  conditions {
    client_app_types = ["all"]

    applications {
      included_applications = ["All"]
    }

    users {
      included_users  = ["All"]
      excluded_groups = [var.emergency_access_group_id]
    }

    locations {
      included_locations = ["All"]
      excluded_locations = [azuread_named_location.uk.object_id]
    }
  }

  grant_controls {
    operator          = "OR"
    built_in_controls = ["block"]
  }
}
```

In GitHub, add a repository Actions variable named `EMERGENCY_ACCESS_GROUP_ID` containing the group's object ID. Add this entry to the existing job-level `env` mapping in `.github/workflows/terraform-run.yml`:

```yaml
TF_VAR_emergency_access_group_id: ${{ vars.EMERGENCY_ACCESS_GROUP_ID }}
```

Terraform reads `TF_VAR_` environment variables as input values. Putting the mapping in the reusable workflow supplies the same value to plan and apply.

The variable checks the ID's format. It does not verify that the group contains the intended accounts; check its membership in Entra before deployment.

> **Emergency access:** Confirm the exclusion group exists and contains your tested emergency-access accounts. The example references that group; it does not create or populate it.

For users in scope, this policy would block access from outside the selected country. The `block` grant control expresses that decision; `enabledForReportingButNotEnforced` keeps it from enforcing the block.

The reference to `azuread_named_location.uk.object_id` creates a Terraform dependency. Terraform creates the location before the policy, regardless of file ordering.

Excluding the UK from this policy does not bypass other policies. Microsoft documents how [report-only evaluation](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only) records results without enforcing the policy.

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

## Validate and review the proposed change

[Terraform workflow checks](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-run.yml)

Run formatting and static validation from your starter repository:

```bash
cd terraform
terraform fmt -check -diff
terraform init -backend=false
terraform validate
```

For a fresh local checkout, `-backend=false` lets you initialise providers for validation without accessing remote state. These checks do not authenticate to Entra or prove the policy will behave as intended.

The authenticated workflow runs `tflint`, a Terraform configuration linter, followed by formatting, backend initialisation, validation, and planning. If you use its lint configuration locally, also run:

```bash
tflint --init
tflint -f compact
```

1. Commit the two resource files and the supporting workflow input change.
2. Open a pull request against `main`.
3. Wait for the authenticated GitHub Actions plan.
4. Read the resource changes in the plan output or uploaded artifact.

For the new-resource path, with an otherwise prepared configuration, expect:

```text
Plan: 2 to add, 0 to change, 0 to destroy.
```

Check the country list, emergency-access group ID, location reference, and report-only state. For imports, check the import-only result described earlier instead.

A green workflow confirms that its checks passed. Unexpected changes still need investigation before merging.

## Deploy and inspect the result in Entra

[Main branch apply workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-apply-main.yml)

1. Merge the reviewed pull request to `main`.
2. Approve the `production` deployment if its environment has required reviewers configured.
3. Confirm that the apply workflow succeeds.
4. Open **Entra ID → Conditional Access → Named locations** in the Entra admin centre.
5. Check the location's country list and unknown-location setting.
6. Open the policy and verify its users, applications, exclusions, and **Report-only** state.

For adopted objects, verify their preserved settings and state instead of expecting the tutorial's report-only setting.

The repository triggers apply on a push to `main`. Its reusable workflow generates a plan during that run, saves it as `tfplan`, and applies that saved plan.

That plan is new to the apply run; it is not the earlier pull request's plan artifact. The `production` environment's protection rules establish the approval gate before the job starts.

I keep that distinction visible because tenant changes between review and deployment can affect the later plan. The workflow does not pause again between generating and applying it.

## Check the policy against representative sign-ins

[Analyse report-only results](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only)

Use Conditional Access **What If** analysis to check policy scope against supplied sign-in conditions. Then inspect actual sign-in logs, including the **Report-only** tab, to check what Entra evaluated.

For the new policy in this article, the expected outcomes are:

| Scenario | Expected outcome for this policy |
| --- | --- |
| In-scope user inside the UK | Not applied: the location is excluded |
| In-scope user outside the UK | Report-only failure: the block would apply |
| In-scope user from an unknown country | Outside the excluded location; the block would apply if the other conditions match |
| Emergency-access account in the exclusion group | Not applied: the account is excluded through group membership |

These results describe this policy. Other policies still affect the final sign-in outcome.

Include travelling users, remote workers, and traffic through organisational proxies when reviewing operational impact. A test from one office address cannot establish whether the policy suits everyone.

Keep enforcement as a separate, reviewed change after examining representative sign-ins. The next decision is whether the evidence supports enabling the block.

## Troubleshoot authentication, state, and policy results

| Symptom | What to check |
| --- | --- |
| OIDC authentication fails | Compare the issuer, audience, and subject with the [previous article](/identity-access-management/articles/github-actions-entra-oidc/) |
| Microsoft Graph reports insufficient privileges | Check application permissions and administrator consent for the failing resource |
| Terraform cannot access state | Check backend configuration, Azure permissions, and storage network access |
| The exclusion-group input is missing | Check the repository Actions variable and the reusable workflow's `TF_VAR_emergency_access_group_id` mapping |
| A sign-in appears in the wrong country | Check the public egress address, where traffic leaves your network, and Microsoft's detected location |
| The object already exists in Entra | Import it; matching its display name does not connect it to Terraform state |
| An enforced policy has an unexpected effect | Use the recovery process to return it to report-only or disabled, then reconcile configuration and state |

For a normal policy change, deploy the correction through review. Reverting Git alone does not change Entra; an apply must carry the correction into the tenant.

If access is disrupted, use the tested emergency-access process to restore it. Record any portal correction in Terraform before another apply can overwrite it.

## Final thoughts

I have kept the example small so that each part of the change remains easy to inspect. The location describes a country; the policy references it; the plan shows what Terraform intends to do.

The useful result is a repeatable process for defining, reviewing, deploying, and checking Entra configuration. Import extends that process to existing objects without requiring you to recreate them.

Leave the new policy in report-only mode while gathering evidence. Deciding whether to enforce it needs operational judgement beyond a successful Terraform apply.

## References

- [Entra ID as Code repository](https://github.com/johnnolan/entra-id-as-code)
- [Connect GitHub Actions to Entra ID with OIDC](/identity-access-management/articles/github-actions-entra-oidc/)
- [Federated credentials setup runbook](https://github.com/johnnolan/entra-id-as-code/blob/main/docs/runbooks/setup-federated-credentials.md)
- [Reusable Terraform workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-run.yml)
- [Named location resource and import format](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/named_location)
- [Conditional Access policy resource and import format](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/conditional_access_policy)
- [Conditional Access network signals](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-assignment-network)
- [Conditional Access report-only evaluation](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only)
- [Generate Terraform configuration for imports](https://developer.hashicorp.com/terraform/language/import/generating-configuration)
