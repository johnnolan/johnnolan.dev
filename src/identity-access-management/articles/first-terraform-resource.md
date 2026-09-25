---
title: "Your first Entra ID policies with Terraform: Named Location and Conditional Access Policy"
description: "Create a named location and a report-only Conditional Access policy, deploy them through GitHub Actions, or import existing Entra configuration."
draft: false
date: 2026-09-25
topics: ["entra-id", "terraform", "github-actions", "security"]
---

## Introduction

[Connect GitHub Actions to Entra ID with OIDC](/identity-access-management/articles/github-actions-entra-oidc/)

The previous article covered [OIDC (OpenID Connect) authentication for GitHub](/identity-access-management/articles/github-actions-entra-oidc/), which lets GitHub Actions use short-lived tokens, Microsoft Graph permissions, remote state access, and the GitHub deployment environment.

This article uses that connection to manage configuration. Our new Terraform will manage and describe resources, show proposed changes in a Terraform plan, and create them during an apply, all through GitHub Actions.

We will create two new resources, `named-locations.tf` and `conditional-access.tf`, review their plan, deploy through GitHub, and inspect the result in Entra.

> There is also an alternative path for importing objects you already manage through the portal. We will cover this in a future article.

## Check the tenant and supporting setup

[Federated credentials setup runbook](https://github.com/johnnolan/entra-id-as-code/blob/main/docs/runbooks/setup-federated-credentials.md)

Before adding resources, confirm that you have:

- Completed the previous [GitHub-to-Entra setup, including its Terraform preparation steps](/identity-access-management/articles/github-actions-entra-oidc/).
- A test Entra tenant.
- Working Terraform provider configuration, remote state, and GitHub plan and apply workflows.
- Reviewed the tenant's existing Conditional Access policies and Security Defaults configuration.
- Ensure the files `main.tf`, `outputs.tf` and `variables.tf` are present in a subfolder called `terraform`.

> **Licensing:** Conditional Access requires Microsoft Entra ID P1 or an entitlement that includes it. Check Microsoft's [licence requirements](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview#license-requirements) for the users in scope.
>
> **Security Defaults:** Use a tenant already prepared for Conditional Access. Do not disable Security Defaults just to run this example; it does not replace those protections. Follow Microsoft's [transition guidance](https://learn.microsoft.com/en-us/entra/fundamentals/security-defaults) when planning that change.

## Prepare the folder and automation permissions

[Terraform baseline files to get started](https://github.com/johnnolan/entra-id-as-code/tree/main/examples/terraform-starter)

1. Create a feature branch in your prepared starter repository.
2. Confirm that its `terraform` directory contains the [provider, backend, and input variable configuration](https://github.com/johnnolan/entra-id-as-code/tree/main/examples/terraform-starter).
3. Check that both plan and apply run from that directory.
4. Confirm the automation identity's Microsoft Graph application permissions and administrator consent.

For example, create the branch from the repository root:

```bash
git checkout -b feature/first-entra-policy
```

The working folder will contain:

```text
terraform/
├── main.tf                 # Provider and backend configuration
├── variables.tf            # Supporting inputs
├── outputs.tf              # Supporting outputs
├── named-locations.tf      # New location resource
└── conditional-access.tf   # New policy and its exclusion-group input
```

> **IMPORTANT!** Ensure you grant `Application` Graph permissions for `Policy.Read.All` and `Policy.ReadWrite.ConditionalAccess` on your Service Principle that runs the Terraform code

## Create the named location

[Named location resource](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/named_location)

1. Create `terraform/named-locations.tf`.
2. Add the following resource.

```hcl
resource "azuread_named_location" "named_location_restricted_signin" {
  display_name = "Restricted Sign-in Locations"

  country {
    countries_and_regions                 = ["GB"]
    include_unknown_countries_and_regions = false
  }
}
```

The resource label, `named_location_restricted_signin`, identifies this declaration within Terraform. The `display_name` identifies it in the Entra portal. `GB` is the two-letter country code for the United Kingdom.

Creating the named location does not restrict access, it just defines it.

A VPN (virtual private network) or proxy can change the public address Entra sees. Geolocation accuracy also affects the result; a country is not proof that a sign-in is trustworthy. Microsoft's [network guidance](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-assignment-network) explains how these signals work.

## Create the report-only policy

[Conditional Access policy resource](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/conditional_access_policy)

Conditional Access evaluates sign-in conditions and applies access controls when those conditions match. This example includes all users and applications, then excludes the UK location.

1. Create `terraform/conditional-access.tf`.
2. Add the policy below.

```hcl
resource "azuread_conditional_access_policy" "ca_1050_block_high_risk_countries" {
  depends_on = [
    azuread_named_location.named_location_restricted_signin,
  ]
  display_name = "GLOBAL - 1050 - BLOCK - High-Risk Countries"
  state        = "enabledForReportingButNotEnforced"

  conditions {
    client_app_types = ["all"]
    applications {
      included_applications = ["All"]
    }
    users {
      included_users = ["All"]
    }
    locations {
      included_locations = ["All"]
      excluded_locations = [azuread_named_location.named_location_restricted_signin.object_id]
    }
  }
  grant_controls {
    operator          = "OR"
    built_in_controls = ["block"]
  }
}
```

For users in scope, this policy would block access from outside the selected country. The `block` grant control expresses that decision; `enabledForReportingButNotEnforced` keeps it from enforcing the block.

The reference to `azuread_named_location.named_location_restricted_signin.object_id` creates a Terraform dependency. Terraform creates the location before the policy, regardless of file ordering.

Excluding the UK from this policy does not bypass other policies. Microsoft documents how [report-only evaluation](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only) records results without enforcing the policy.

## Validate and review the proposed change

[Terraform workflow checks](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-run.yml)

Once you have these two files in place, you can run formatting and static validation from your repository:

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
3. Wait for the GitHub Actions plan workflow to complete.
4. Read the resource changes in the plan output or uploaded artifact.

For the new resources, we should expect the following at the bottom of the plan file, `2 to add` for our 2 files created.

```text
Plan: 2 to add, 0 to change, 0 to destroy.
```

Check you can see the country list, location reference, and report-only state.

A green workflow confirms that its checks passed.

## Deploy and inspect the result in Entra

[Main branch apply workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-apply-main.yml)

1. Merge the reviewed pull request into `main`.
2. Approve the `production` deployment if its environment has required reviewers configured.
3. Confirm that the apply workflow succeeds.
4. Open **Entra ID → Conditional Access → Named locations** in the Entra admin centre.
5. Check the location's country list.
6. Open the policy and verify its users, applications, exclusions, and **Report-only** state.

## Check the policy against representative sign-ins

[Analyse report-only results](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only)

You should use the Conditional Access **What If** feature to check policy scope against the new Conditional Access policy. Then inspect actual sign-in logs, including the **Report-only** tab, to check what Entra evaluated and if everything is working as expected.

Once you are happy with your testing, you can do a new Pull Request changing the Conditional Access Policy `state` to be `enabled`.

## Troubleshoot authentication, state, and policy results

| Symptom | What to check |
| --- | --- |
| OIDC authentication fails | Compare the issuer, audience, and subject with the [previous article](/identity-access-management/articles/github-actions-entra-oidc/) |
| Microsoft Graph reports insufficient privileges | Check application permissions and administrator consent for the failing resource |
| Terraform cannot access state | Check backend configuration, Azure permissions, and storage network access |
| A sign-in appears in the wrong country | Check the public egress address, where traffic leaves your network, and Microsoft's detected location |
| An enforced policy has an unexpected effect | Use the recovery process to return it to report-only or disabled, then reconcile configuration and state |

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
