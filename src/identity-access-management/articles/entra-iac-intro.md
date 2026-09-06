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

[Repository README](https://github.com/johnnolan/entra-id-as-code/blob/main/README.md)

The complete Terraform configuration, GitHub Actions workflows, runbooks, and security guidance are available in the [Entra ID as Code repository](https://github.com/johnnolan/entra-id-as-code).

[![GitHub Repo Image](/assets/posts/iam/entra-iac-intro/repo.png)](/assets/posts/iam/entra-iac-intro/repo.png)

Microsoft Entra ID is part of the security boundary for almost every Microsoft cloud environment. That makes manual changes in the portal harder to reason about as a tenant grows.

I wanted a better way to describe those changes, review them, and apply them with a repeatable process. This repository is my working example of that approach: Entra ID managed with Terraform, reviewed through GitHub, and checked with automated security tests.

## Introduction

[Terraform configuration](https://github.com/johnnolan/entra-id-as-code/tree/main/terraform)

The repository manages tenant configuration as code. Terraform describes the intended state, pull requests provide a review point, and GitHub Actions applies approved changes after they reach `main`.

> This is not an attempt to hide the complexity of identity management behind a single module. Entra has provider gaps, singleton tenant policies, sensitive rollout decisions, and permissions that need careful review. The repository keeps those details visible.

The aim is a practical starting point for teams that want identity changes to be traceable and repeatable without treating automation as a substitute for operational judgement.

## What the repository does

[Terraform resources](https://github.com/johnnolan/entra-id-as-code/tree/main/terraform)

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

[Terraform workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-run.yml)

The normal workflow is simple:

1. Change Terraform configuration in a branch.
2. Open a pull request against `main`.
3. Let GitHub Actions run formatting, linting, validation, and a Terraform plan.
4. Review the plan and any security implications.
5. Merge the approved change.
6. Let the main-branch workflow apply the configuration.

### Workflow overview

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

[GitHub Actions workflows](https://github.com/johnnolan/entra-id-as-code/tree/main/.github/workflows)

Terraform is only one part of the repository. The GitHub Actions workflows provide the delivery and feedback loop around it.

### Pull request plans

[Pull Request Workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-run.md)

Every relevant pull request gets a plan. The reusable workflow runs `tflint`, `terraform fmt`, `terraform init`, `terraform validate`, and `terraform plan`. The result is uploaded as an artifact and summarised in the pull request.

[![Terraform Actions](/assets/posts/iam/entra-iac-intro/tfaction.png)](/assets/posts/iam/entra-iac-intro/tfaction.png)

### Apply on merge

[Apply Workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-apply-main.md)

Changes merged to `main` use the same reusable workflow with the `apply` command. Keeping plan and apply in the same workflow path reduces the chance that the two operations behave differently.

### Drift detection

[Drift Detection Workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-drift-daily.md)

The daily drift workflow runs a detailed Terraform plan. When the tenant no longer matches the configuration, the workflow creates or updates a GitHub issue with the plan details.

Drift is useful information. It can point to a portal change, an external automation process, a provider limitation, or a resource that was never imported correctly. The issue gives that difference a place to be investigated instead of letting it disappear into the next deployment.

[![Drift Detection](/assets/posts/iam/entra-iac-intro/driftdetection.png)](/assets/posts/iam/entra-iac-intro/driftdetection.png)

### Maester checks

[Maester Workflow](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/workflows/terraform-maester.md)

The repository also runs Maester tests on a schedule. Maester checks the tenant against Microsoft security recommendations and other identity controls, then publishes an HTML report as a workflow artifact.

Terraform answers, "Does the tenant match the declared configuration?" Maester answers, "Does the tenant meet these security checks?" Those are related questions, but they are not the same question.

[![Maester Tests](/assets/posts/iam/entra-iac-intro/maester.png)](/assets/posts/iam/entra-iac-intro/maester.png)

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

[Terraform documentation and resource guides](https://github.com/johnnolan/entra-id-as-code/tree/main/terraform)

The repository is also a record of the decisions behind the configuration.

- Terraform files show which tenant objects are managed.
- Companion Markdown guides explain provider choices, imports, and permissions.
- Repository skills route security and documentation work to focused guidance.
- Workflow files show how plans, applies, drift, and Maester tests run.
- Pull requests provide an audit trail for changes.

This is especially useful for resources that are not created from scratch. Some Entra policies are singletons that already exist in a tenant. Import blocks allow Terraform to adopt those objects while keeping the transition explicit.

## Using AI Skills as project context

[Copilot instructions](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/copilot-instructions.md)

The repository also uses AI Skills to make its security and Terraform guidance available during development. These are focused instruction sets that help an AI assistant understand the repository before suggesting or changing code.

[![Skills](/assets/posts/iam/entra-iac-intro/skills.png)](/assets/posts/iam/entra-iac-intro/skills.png)

The Markdown files provide the context those Skills need. The root [Copilot instructions](https://github.com/johnnolan/entra-id-as-code/blob/main/.github/copilot-instructions.md) map Terraform files to specialist Skills, while companion guides explain resources, permissions, imports, workflows, and operational decisions.

For example, a request to change `terraform/conditional-access.tf` should use the Conditional Access architect Skill. A security review of any Terraform file should use the security baseline auditor Skill, which brings Microsoft, NCSC, and Maester guidance into the review process.

This helps in three ways:

- **Security testing:** the assistant has local guidance for checking break-glass exclusions, least-privilege permissions, rollout states, and relevant Maester controls.
- **Terraform changes:** the assistant knows when to prefer a typed `azuread_*` resource, when Microsoft Graph is required, and which constraints apply to the file being changed.
- **Onboarding:** new contributors can read the Markdown guides to understand how the tenant is structured, how workflows operate, and why certain resources use imports or Graph APIs.

> **The Skills do not replace a plan review, tenant testing, or human approval.** They make the repository's existing decisions easier to apply consistently and give new users a clearer place to start.

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

[Entra ID as Code repository](https://github.com/johnnolan/entra-id-as-code)

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
