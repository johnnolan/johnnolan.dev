---
layout: layouts/article.njk
title: "Managing Entra ID as Code with Terraform"
description: "An introduction to managing Microsoft Entra ID with Terraform, GitHub Actions, OIDC, drift detection, and Maester."
image: "assets/posts/johnnolan.jpg"
date: 2026-09-05
tags:
  - iam
  - entra-id
  - terraform
  - security
  - architecture
contributors: ["John Nolan"]
---

## Repository

The complete Terraform configuration, GitHub Actions workflows, runbooks, and security guidance are available in the [Entra ID as Code repository](https://github.com/johnnolan/entra-id-as-code).

Microsoft Entra ID is part of the security boundary for almost every Microsoft cloud environment. That makes manual changes in the portal harder to reason about as a tenant grows.

I wanted a better way to describe those changes, review them, and apply them with a repeatable process. This repository is my working example of that approach: Entra ID managed with Terraform, reviewed through GitHub, and checked with automated security tests.

## Introduction

The repository manages tenant configuration as code. Terraform describes the intended state, pull requests provide a review point, and GitHub Actions applies approved changes after they reach `main`.

This is not an attempt to hide the complexity of identity management behind a single module. Entra has provider gaps, singleton tenant policies, sensitive rollout decisions, and permissions that need careful review. The repository keeps those details visible.

The aim is a practical starting point for teams that want identity changes to be traceable and repeatable without treating automation as a substitute for operational judgement.

## What the repository does

The Terraform configuration currently covers several parts of an Entra tenant:

- Tenant organisation settings and core policies.
- Conditional Access policies and named locations.
- Authentication strength and authentication method policies.
- Security defaults, authorisation, and external identities policies.
- Group lifecycle settings and the Conditional Access exclusion group.
- Cross-tenant access configuration.
- A dedicated application registration for Maester security tests.

Some of these resources use the typed `azuread_*` resources from the AzureAD provider. Others use `msgraph_resource` because the AzureAD provider does not expose the required Microsoft Graph endpoint or fields yet.

That provider boundary is deliberate. I prefer a typed resource when one exists because it gives Terraform a clearer schema and a more familiar interface. Microsoft Graph remains useful for the parts of Entra that are not covered by the provider.

## How I use it

The normal workflow is simple:

1. Change Terraform configuration in a branch.
2. Open a pull request against `main`.
3. Let GitHub Actions run formatting, linting, validation, and a Terraform plan.
4. Review the plan and any security implications.
5. Merge the approved change.
6. Let the main-branch workflow apply the configuration.

The pull request plan makes the proposed tenant change visible before it is applied. This matters most for Conditional Access, authentication methods, and cross-tenant access, where a technically valid change can still have a large operational impact.

For local work, the same checks can be run from the `terraform` directory:

```bash
terraform fmt -check -diff
terraform init
terraform validate
terraform plan
```

The backend stores Terraform state in Azure Blob Storage. The GitHub workflows authenticate to Azure and Entra with OpenID Connect (OIDC), using short-lived federated tokens instead of a long-lived client secret in GitHub.

## The workflow around Terraform

Terraform is only one part of the repository. The GitHub Actions workflows provide the delivery and feedback loop around it.

### Pull request plans

Every relevant pull request gets a plan. The reusable workflow runs `tflint`, `terraform fmt`, `terraform init`, `terraform validate`, and `terraform plan`. The result is uploaded as an artifact and summarised in the pull request.

### Apply on merge

Changes merged to `main` use the same reusable workflow with the `apply` command. Keeping plan and apply in the same workflow path reduces the chance that the two operations behave differently.

### Drift detection

The daily drift workflow runs a detailed Terraform plan. When the tenant no longer matches the configuration, the workflow creates or updates a GitHub issue with the plan details.

Drift is useful information. It can point to a portal change, an external automation process, a provider limitation, or a resource that was never imported correctly. The issue gives that difference a place to be investigated instead of letting it disappear into the next deployment.

### Maester checks

The repository also runs Maester tests on a schedule. Maester checks the tenant against Microsoft security recommendations and other identity controls, then publishes an HTML report as a workflow artifact.

Terraform answers, "Does the tenant match the declared configuration?" Maester answers, "Does the tenant meet these security checks?" Those are related questions, but they are not the same question.

## Security choices

There are a few principles running through the repository.

### Use short-lived CI authentication

GitHub Actions uses federated credentials and OIDC to obtain tokens for the Entra application. This avoids storing a client secret that could remain valid after a workflow run finishes.

The CI application still needs permissions. Those permissions should be limited to the Terraform resources the repository manages, and an administrator must grant consent after permission changes.

### Keep break-glass access visible

Conditional Access policies exclude a dedicated emergency access group. That exclusion is part of the baseline and should not be removed casually.

Emergency access accounts are not a way around security controls. They are a recovery path for incidents such as a policy mistake, an authentication outage, or a directory problem. They need separate protection, monitoring, and testing.

### Treat tenant-wide changes as decisions

Some changes are structural. Others change how people sign in or collaborate with external tenants. I treat the second group as an operational decision, not as a routine formatting change.

Before enabling a policy, I want a clear scope, a rollout state, a test plan, and a recovery path. A successful Terraform plan cannot prove that every user will have the intended sign-in experience.

## What the repository makes visible

The repository is also a record of the decisions behind the configuration.

- Terraform files show which tenant objects are managed.
- Companion Markdown guides explain provider choices, imports, and permissions.
- Repository skills route security and documentation work to focused guidance.
- Workflow files show how plans, applies, drift, and Maester tests run.
- Pull requests provide an audit trail for changes.

This is especially useful for resources that are not created from scratch. Some Entra policies are singletons that already exist in a tenant. Import blocks allow Terraform to adopt those objects while keeping the transition explicit.

## Topics for future posts

This introduction only covers the shape of the repository. Future posts will go deeper into the decisions that make the approach useful in practice:

- Building a Conditional Access baseline with break-glass exclusions and controlled rollout states.
- Choosing between typed AzureAD resources and Microsoft Graph resources.
- Bootstrapping GitHub Actions with Entra federated credentials.
- Securing and dynamically restricting the Terraform state storage account.
- Importing singleton tenant policies and discovering group settings safely.
- Designing least-privilege Microsoft Graph permissions for Terraform and Maester.
- Using daily drift detection as an operational workflow.
- Combining Terraform configuration checks with Maester security tests.
- Using repository-scoped skills to review Terraform against Microsoft, NCSC, and Maester guidance.

Each topic has a different failure mode. Provider selection is about API coverage and state management. Conditional Access is about user impact and recovery. CI authentication is about trust boundaries. Drift and Maester are about finding differences that Terraform alone cannot explain.

## Final thoughts

Managing Entra ID as code does not make identity simple. It makes the important parts easier to inspect, review, repeat, and discuss.

That is the reason for this repository. It provides a working foundation for tenant configuration, but it also leaves room for the judgement that secure identity work still requires. The later posts will explore those edges in more detail.

## References

- [Repository README](https://github.com/johnnolan/entra-id-as-code/blob/main/README.md)
- [Conditional Access configuration](https://github.com/johnnolan/entra-id-as-code/blob/main/terraform/conditional-access.tf)
- [Reusable Terraform workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-run.yml)
- [Federated credentials runbook](https://github.com/johnnolan/entra-id-as-code/blob/main/docs/runbooks/setup-federated-credentials.md)
- [Storage account network hardening runbook](https://github.com/johnnolan/entra-id-as-code/blob/main/docs/runbooks/storage-account-network-hardening.md)
- [Terraform security baseline auditor skill](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/skills/terraform-security-baseline-auditor/SKILL.md)
- [Microsoft Entra Conditional Access overview](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)
- [Microsoft Entra Terraform provider](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs)
- [Maester](https://maester.dev/)
