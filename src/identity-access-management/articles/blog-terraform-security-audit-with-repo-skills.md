---
title: "Audit Entra ID Terraform with repository skills"
description: "Use repository-scoped skills and context to audit Microsoft Entra ID Terraform."
draft: true
tags:
  - iam
  - terraform
  - security
topics: ["terraform","security"]
image: "/assets/posts/johnnolan.jpg"
---

This post shows how to use repository-scoped Copilot skills and context to audit Microsoft Entra ID Terraform. It follows the workflow used to create the [Terraform audit backlog](terraform-audit-issues.md).

The method combines three inputs:

- Terraform configuration, which describes the tenant state.
- Repository instructions, which define provider and security guardrails.
- Verified Microsoft, NCSC, and Maester guidance, which provides the external baseline.

> **Security requirement**
> An audit can identify a risky setting without changing it. Require approval before changing Conditional Access, authentication methods, or cross-tenant access.

## Start with the repository context

Read the repository instructions before you inspect or edit Terraform. The root instructions map Terraform files to specialist skills.

For example:

- `terraform/conditional-access.tf` uses the Conditional Access architect skill.
- `terraform/main.tf` uses the main permissions skill.
- Any audit of `terraform/*.tf` uses the security baseline auditor skill.
- Documentation work uses the GDS technical writer skill.

The global instructions also establish two important rules:

- Use a typed `azuread_*` resource when the AzureAD provider supports the required object.
- Never place tenant IDs, client secrets, or credentials directly in Terraform files.

The security baseline auditor adds more rules. It requires plain HCL objects for `msgraph_resource.body`, import blocks for adopted fixed resources, minimal changes, and validation after each edit.

## Ask Copilot to audit one file

Start with a concrete Terraform file. A focused request gives the skill a clear resource boundary.

```text
Using the terraform-security-baseline-auditor skill, audit terraform/conditional-access.tf.
Read the file fully, identify every resource and API path, verify relevant Microsoft,
NCSC, and stable Maester guidance, report findings by severity, and do not apply
behavior-changing changes without asking first.
```

The skill should then:

1. Read every resource in the target file.
2. Identify the provider type, API path, and configured fields.
3. Search the local Maester indexes for candidate test IDs.
4. Fetch each candidate test page before citing it.
5. Compare the configuration with the verified guidance.
6. Separate safe structural changes from tenant behavior changes.
7. Run `terraform fmt` and `terraform validate` after edits.
8. Update the file's companion guide.

Use one file at a time when you want implementation changes. Use the complete directory when you want an inventory first.

## Audit the complete Terraform directory

To create a directory-wide inventory, use a request such as:

```text
Using the terraform-security-baseline-auditor skill, audit all Terraform files
under terraform/. Build a file-by-file resource inventory, identify security and
HCL issues, verify citations against stable Microsoft and Maester pages, and create
a prioritized remediation backlog. Do not change live tenant behavior without my approval.
```

This repository contains typed AzureAD resources and Microsoft Graph resources. The inventory should cover both.

Examples include:

- `azuread_conditional_access_policy` resources in `terraform/conditional-access.tf`.
- `msgraph_resource` singleton policies in `terraform/policies.tf`.
- Authentication method configurations in `terraform/authentication-method-policies.tf`.
- Cross-tenant defaults in `terraform/cross-tenant-access.tf`.
- The Maester application and GitHub federated credential in `terraform/service-principles.tf`.

Do not treat `terraform validate` as a security audit. Terraform validates syntax, types, and provider schemas. It does not prove that an authentication-strength ID exists, that an external collaboration policy is narrow enough, or that a permission is necessary.

## Verify external guidance

Use sources in this order:

1. Microsoft Learn for the feature and API contract.
2. NCSC guidance for identity, Zero Trust, and cloud security alignment.
3. Stable Maester test pages for executable checks and remediation guidance.

The local indexes in `.github/skills/terraform-security-baseline-auditor/references` speed up discovery. They are lookup aids, not citations.

Always fetch the individual stable test page before citing a test. Do not cite `/docs/next/tests/` pages.

For example, this repository verified these controls during the audit:

- `MT.1005` checks emergency access exclusions from Conditional Access.
- `MT.1016` checks MFA for guest access.
- `EIDSCA.AF03` checks FIDO2 attestation.
- `EIDSCA.AF04` checks FIDO2 key restrictions.
- `EIDSCA.AT02` checks one-time Temporary Access Pass use.

The audit also exposed why this verification matters. The current `MT.1057` page does not describe group expiration, despite its title in the local index. The page currently describes application registrations with secrets. A stale index must not become a stale compliance claim.

## Separate findings from decisions

Classify findings by whether they can be fixed without changing tenant behavior.

Safe structural work can usually proceed directly:

- Replace `jsonencode` with the structured HCL required by the repository convention.
- Move an owner-specific notification address into a Terraform variable.
- Add missing documentation.
- Add an import block when adopting a known fixed resource.
- Remove an unused placeholder field when the provider permits it.

Tenant behavior requires a decision:

- Restrict all-user and all-application cross-tenant access.
- Enable Continuous Access Evaluation.
- Enforce FIDO2 key restrictions.
- Narrow authentication-method targets.
- Promote a report-only Conditional Access policy.
- Remove a delegated write permission from an application.

Record the decision, affected resource, rollout plan, and rollback plan in the backlog. The [audit issues document](terraform-audit-issues.md) uses this format for every finding.

## Create a useful backlog

A useful backlog item answers five questions:

- What is wrong?
- Where is it configured?
- Why does it matter?
- What is the smallest safe fix?
- How will we prove that the fix worked?

For example:

```markdown
- [ ] Confirm authentication-strength policy IDs
  - File: `terraform/variables.tf`, `terraform/conditional-access.tf`
  - Problem: The defaults are all-zero UUID placeholders.
  - Fix: Query `GET /policies/authenticationStrengthPolicies` and set tenant inputs.
  - Completion check: Every referenced ID exists and resolves to the intended policy.
```

Completion checks keep the work testable. They also prevent a backlog from becoming a collection of general recommendations.

## Validate every change

Run validation from the repository root:

```text
terraform fmt -check -diff
terraform validate
tflint --format compact
```

For a behavior-changing resource, also create a plan with the intended variables and inspect the affected tenant objects.

Use a non-production tenant for enforcement changes. Test sign-in, guest collaboration, authentication registration, and GitHub Actions token exchange when those paths change.

> **Security requirement**
> Never merge a tenant-wide access change because a static check passes. Review the Terraform plan and validate the resulting Microsoft Graph object in the target tenant.

## Use the skills during remediation

After the inventory exists, route each fix to the narrowest skill.

```text
Fix only the structured HCL issue in terraform/policies.tf.
Use the repository's security baseline auditor rules. Preserve all policy values,
run terraform fmt and terraform validate, and show the resulting diff.
```

For Conditional Access, use the specialist skill:

```text
Using the terraform-conditional-access-architect skill, review the proposed change
to terraform/conditional-access.tf. Check break-glass exclusions, rollout state,
policy scope, and Microsoft and NCSC baseline alignment. Do not enable a report-only
or disabled policy without my approval.
```

For documentation, use the technical writing skill:

```text
Using the gds-tech-writer skill, update the companion guide for this Terraform file.
Preserve resource names, API paths, fields, permissions, and verified URLs. Explain
technical terms on first use and add visible security callouts where required.
```

This routing keeps implementation context local. It also prevents a documentation request from silently changing Terraform behavior.

## Keep the repository trustworthy

Review the skill indexes and mapping files as maintained code. Remove stale test IDs, verify URLs, and record which Terraform files each control covers.

Keep companion guides next to their Terraform files. Each guide should explain:

- What each resource manages.
- Why non-obvious values exist.
- Which permissions the CI application needs.
- Which Microsoft and Maester controls apply.
- Which settings require an operational decision.

The result is more than a one-time audit. It is a repeatable path from Terraform configuration to verified evidence, controlled remediation, and maintainable documentation.

## References

- [Repository README](../README.md)
- [Terraform audit backlog](terraform-audit-issues.md)
- [GDS technical writer skill](../.github/skills/gds-tech-writer/SKILL.md)
- [Terraform security baseline auditor skill](../.github/skills/terraform-security-baseline-auditor/SKILL.md)
- [Microsoft Entra Conditional Access overview](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)
- [Manage authentication methods](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods-manage)
- [Authorization policy resource](https://learn.microsoft.com/en-us/graph/api/resources/authorizationpolicy)
- [Cross-tenant access policy resource](https://learn.microsoft.com/en-us/graph/api/resources/crosstenantaccesspolicy)
- [Maester MT.1005](https://maester.dev/docs/tests/MT.1005)
- [Maester MT.1016](https://maester.dev/docs/tests/MT.1016)
- [Maester EIDSCA.AF03](https://maester.dev/docs/tests/EIDSCA.AF03)
- [Maester EIDSCA.AF04](https://maester.dev/docs/tests/EIDSCA.AF04)
- [Maester EIDSCA.AT02](https://maester.dev/docs/tests/EIDSCA.AT02)
