---
layout: layouts/article.njk
title: "Tech Ethics in Architectural Decision Records"
description: "Using Tech Ethics when writing Architectural Decision Records for your software."
date: 2022-08-08
tags: 
  - hcta
  - ethics
contributors: ["John Nolan"]
---

## Introduction

I have had the privilige to have worked with a Digital Sociologist recently called Lisa Talia Moretti. She introduced me to the concept of Tech Ethics.

One of my passions in development is front end performance and the concept of tech privilige (this will be another post in the future). This introduced me to a wider view on ethics in development.

[A blog post Lisa has written titled "Tech Ethic Decisions"](https://docs.modernising.opg.service.justice.gov.uk/research-development/articles/tech-ethic-decisions/) introduces the concept and I instantly began to wonder how you could take this and apply it to a teams every day working.

In this article we will be using these guidelines, so I recommend you pause to take time to read her article.

> "When we design digital products and services, we think about the impact we’re having on the systems in which people live their lives" - Lisa Talia Moretti

### What is an Architectural Decision Record?

TODO: 

[Michael Nygard](https://cognitect.com/authors/MichaelNygard.html) introduces the concept in his blog post ["Documenting Architecture Decisions"](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

Intro
Link
Credit


## How to setup Tech Ethics in Architectural Decision Records

We want to take the top level sections of the article and add these as sections for a team member to fill in as part of an Architectural Decision Record.

* Mitigate against being tech deterministic
* Ensure you conduct inclusive research
* Think big and imagine what the impact of your work can be
* Interrogate your data decisions

We should also add the example questions to ask as comments in the template to help prompt thought and discussion.

Below is a template of how this could look. It is in a gist so please feel free to take this or suggest edits.

TODO: Enter gist url

## Example ADR

To finish up, below is an example of what an Architectural Decision Record with these extra questions in may end up looking like.

# 0001 - Use Github for source code

## Context

We want to store our source code in a open source, cloud based git provider.

## Ethics

### Mitigate against being tech deterministic

There are other providers we could use, but doing so would not bring any great benefit over our already established best practices for existing services.

We can move to any other provider should we wish due to git being an open standard.

### Ensure you conduct inclusive research

Having our code on Github as a Public repository allows others to learn from and contribute to our work. This could include anyone from students learning to big corporations wanting to use and contribute. 

### Think big and imagine what the impact of your work can be

Allowing the access of our code via the platform will encourage others to be able to help contribute and reuse our services built.

The more we can share with others, the stronger our solutions will be.

### Interrogate your data decisions

We should ensure that our repositories are marked as Open Source as soon as we feel comfortable.

With our code in the open, people can gain trust that we are not abusing their data or privacy and help identify any potential security issues we may miss.

We should never store any Personal Identifiable Information into our Repository nor any secrets committed.

### Decision

We should use Github for storing our source code.

### Consequences

We will be open source from the start.

If we use other Github features such as Actions, we must be aware that we cannot move to another provider quickly without first replacing built in functionality with another tool.
