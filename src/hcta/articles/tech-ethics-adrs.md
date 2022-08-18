---
layout: layouts/article.njk
title: "Tech Ethics in Architectural Decision Records"
description: "Adding Tech Ethics when writing Architectural Decision Records for your service."
date: 2022-08-22
tags: 
  - hcta
  - ethics
contributors: ["John Nolan"]
---

## Introduction

I have had the privilege to have worked with a Digital Sociologist recently who introduced me to the concept of Tech Ethics.

One of my passions in development is front end performance and the concept of tech privilege (this will be another post in the future). This introduced me to a wider view on ethics in development.

[A blog post by Lisa Talia Moretti titled "Tech Ethic Decisions"](https://docs.modernising.opg.service.justice.gov.uk/research-development/articles/tech-ethic-decisions/) introduces the concept and I instantly began to wonder how you could take this and apply it to a teams every day working.

In this article we will be using these guidelines, so I recommend you pause to take time to read her article.

> "When we design digital products and services, we think about the impact we’re having on the systems in which people live their lives" - Lisa Talia Moretti

### What is an Architectural Decision Record (ADR)?

[Michael Nygard](https://cognitect.com/authors/MichaelNygard.html) talks in detail in his blog post ["Documenting Architecture Decisions"](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

Architectural Decision Records are a way of leaving an historical view of decisions made and why they were made during the development of a service.

This gives the following advantages

- Remembering at a later date why you made a decisions
- The ability to revisit and update your decisions
- New team members are able to understand why decisions have been made and onboard quickly
- When shared publicly, gives an opportunity for others to help with alternative solutions

An ADR is laid out in a simple format to make it light weight and quick to fill in. It consists of the following sections.

- Title
  - Short name of the decision you are talking about.
- Context
  - The situation you find yourself in that has raised the need for the decision.
- Decision
  - A "We will..." description of what you will do.
- Status
  - A status of the decision, this includes Accepted, Rejected, Proposed, Deprecated and Superseded.
- Consequences
  - Any downstream consequences, positive or negative, that will be caused by this decision.

## First version of adding Tech Ethics to ADRs

The first version of adding Tech Ethics was to add all the sub headings to the ADR template.

``` markdown
- Title
- Context
- Ethics
  - Mitigate against being tech deterministic
  - Ensure you conduct inclusive research
  - Think big and imagine what the impact of your work can be
  - Interrogate your data decisions
- Decision
- Status
- Consequences
```

The main aim of ADRs is to be as concise as possible and after testing this in a Service called [Modernising Lasting Power of Attorney](https://docs.modernising.opg.service.justice.gov.uk/adr/articles/0002-verifiable-credentials/) it felt too complex.

After learning from this, I propose a simpler version of just having Ethics as a section with the sub headings being prompts.

## How to setup Tech Ethics in Architectural Decision Records

We want to use the four top level sections of Tech Ethics and use them as points of reference.

We should have one section called Ethics.

We should include in comments on the ADR template, a link to the original article and the list of sub headings as a prompt.

Below is a template of how this could look. It is in a gist so please feel free to take this or suggest edits.

The final ADR template that I use can be found in this repository at [https://github.com/johnnolan/johnnolan.dev/tree/main/docs/adrs/0000-adr-template.md](https://github.com/johnnolan/johnnolan.dev/tree/main/docs/adrs/0000-adr-template.md)

<script src="https://gist.github.com/johnnolan/5a650b3f376cb88012ca289680185dac.js"></script>

## Example ADR

Below is an example of what an Architectural Decision Record with Tech Ethics looks like.

You can see the template and a copy of this decision in the [docs folder of this Github repository](https://github.com/johnnolan/johnnolan.dev/tree/main/docs/adrs).

# 0001 - Use Github for source code storage

Date: 2022-08-18

## Status

Accepted

## Context

We want to store our source code in a open source, cloud based git provider.

## Ethics

There are other providers we could use, but doing so would not bring any great benefit over our already established best practices for existing services.

We can move to any other provider should we wish due to git being an open standard.

Having our code on Github as a Public repository allows others to learn from and contribute to our work. This could include anyone from students learning to big corporations wanting to use and contribute.

Allowing the access of our code via the platform will encourage others to be able to help contribute and reuse our services built.

The more we can share with others, the stronger our solutions will be.

We should ensure that our repositories are marked as Open Source as soon as we feel comfortable.

With our code in the open, people can gain trust that we are not abusing their data or privacy and help identify any potential security issues we may miss.

We should never store any Personal Identifiable Information into our Repository nor any secrets committed.

### Decision

We should use Github for storing our source code.

### Consequences

We will be open source from the start.

If we use other Github features such as Actions, we must be aware that we cannot move to another provider quickly without first replacing built in functionality with another tool.

## Article References

* ["Documenting Architecture Decisions" by Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
* ["Tech Ethic Decisions" by Lisa Talia Moretti](https://docs.modernising.opg.service.justice.gov.uk/research-development/articles/tech-ethic-decisions/)
* [Modernising Lasting Power of Attorney ADR](https://docs.modernising.opg.service.justice.gov.uk/adr/articles/0002-verifiable-credentials/)