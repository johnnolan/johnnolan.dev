---
layout: layouts/article.njk
title: "AMS (Archimate, Mermaid and Structurizr) - The Three Peaks of Architecture"
description: "AMS - The three tools to..."
image: "assets/posts/johnnolan.jpg"
date: 2023-08-09
tags: 
  - hcta
  - architecture
contributors: ["John Nolan"]
---

## Introduction

I come from a Agile Technical Architecture background. This means operating in a servant role for teams rather than top down.

In this role, your responsibilities are

- Enabling people to make decisions
- Empathy and support for people when things go wrong
- Provide high level business and technology requirements to the technical teams
- Empower teams to own their work
- Share the understanding of where we are (AS IS)
- Provide the vision of where we are going (TO BE)
- Be the bridge between the business and technical teams

These responsibilities give you a split of two main skill areas.

1. Communication
2. Technical knowledge

You need to be able to wear different hats and adapt quickly to your situation.

### How you communicate

- Is your audience Product people?
  - Talk about the user value and financial cost of the decisions
- Is your audience Technical people?
  - Talk about the technical vision their decisions need to fit into

### Presenting Technical Knowledge

- Is the team well established and knowledgable?
  - Give them the parameters to work within and stand back so they can do their work.
- Is the team new or Junior heavy?
  - Spend more time pairing and planning to help guide the technical decisions and learning resources.

To get to the point where you can be effective, you have to understand the business, its people and both their capabilities.

You are there to unblock and help, not hinder how people want to work.

## Using AMS (Archimate, Mermaid and Structurizr)

In this article I want to go over a set of tooling and ways of working I use to

- Provide the correct diagram to tell your story
- Maintain your knowledge of the business in one place
- Prevent outdated diagrams existing in your business
- Use Diagrams as Code wherever possible
- Identify where not to use diagrams
- Store your data models where it is appropriate


To do this, you can use three different tools and techniques to gather information, keep it up to date and help you tell a story to the right people in the right way.


## Archimate modelling

> The ArchiMate® modelling language is an open and independent Enterprise Architecture standard that supports the description, analysis and visualisation of architecture within and across business domains. ArchiMate is one of the open standards hosted by The Open Group® and is fully aligned with TOGAF®. ArchiMate aids stakeholders in assessing the impact of design choices and changes.

That is correct, the first tool I want to talk about comes from the TOGAF landscape which lends itself to more Enterprise Architecture modelling rather than Agile Architecture.

Just because a way of working does not fit how we want to work, it doesn't mean there isn't something we cannot learn from it.

With the constant change in Agile ways of working, we sometimes miss a way to centralise all the key business requirements in one place.

I have been a victim of having key business information written down somewhere deep in Google Drive from 3 years ago.

You need somewhere that you can store high level business knowledge. This is where ArchiMate excels.

Using a tool like Archi, you can use the ArchiMate modelling language to store

- Any knowledge that sits outside of the codebase
- Data that will not change on a regular basis
- Data that you will need to present to the business in various views

Within Archi we can easily generate an AS IS model of our Enterprise to understand the complexities of the business and have a place we can revisit on a regular basis to ensure we are meeting the requirements.

- **Business**
  - Business Value
  - Processes
  - Services
  - Actors
  - Contracts
  - Products
  - User Needs
  - Company/Department/Team structure
  - Roles
  - Stakeholders
- **Legislation**
  - Legal
  - Policies
- **Organisation Strategies**
  - Resources
  - Capabilities
  - Value Streams
- **Motivations**
  - Goals
  - Outcomes
  - Drivers
  - Values

If we know the above, we can make better decisions and help others find their way forward when building new products and features.

Below are a few examples on how we can structure our Data Model and the Views we can produce to tell a story.

TODO: Add example images


## Mermaid



## Structurizr

