---
layout: layouts/article.njk
title: "Self-Hosted Development Pipeline Setup with Docker"
description: "How to setup and run your own Self-Hosted Development Pipeline Setup including Git, CI/CD, Docker Registry and Renovate."
image: "assets/posts/johnnolan.jpg"
date: 2025-07-30
tags: 
  - hcta
  - architecture
  - selfhosted
contributors: ["John Nolan"]
---

## Show me the code

You can find the `docker-compose.yml` in this gist [https://gist.github.com/johnnolan/09ffb59020202e9e307b7f28289ddadd](https://gist.github.com/johnnolan/09ffb59020202e9e307b7f28289ddadd).

## Introduction

This article will briefly show you how to setup a self-hosted local CI/CD pipeline with Git, Docker Registry and Renovate.

* [Gitea](https://about.gitea.com/) (GitHub clone)
* [Woodpecker CI](https://woodpecker-ci.org/) (CI/CD)
* [Docker Registry](https://hub.docker.com/_/registry) (Self-hosted Docker Registry)
* [Docker Registry UI](https://github.com/Joxit/docker-registry-ui) (Docker Registry UI)
* [Renovate](https://hub.docker.com/r/renovate/renovate) (Dependency management)
  
## Setup

I run a Ubuntu Server at home, but this can work on any Docker compatible operating system.

To setup these tools, download this docker compose file and run `docker compose up -d`. After a few minutes, all the services will be up and running and awaiting to be configured.

For setup on each you can follow the instructions on each of the links above in the Introduction section. After setup you can reach each service at the following urls

| Name | Link |
| --- | --- |
| Gitea | [http://localhost:3000](http://localhost:3000) |
| Woodpecker CI | [http://localhost:8000](http://localhost:8000) |
| Docker Registry UI | [http://localhost:80](http://localhost:80) |

### Code

<script src="https://gist.github.com/johnnolan/09ffb59020202e9e307b7f28289ddadd.js?file=docker-compose.yml"></script>

## Renovate

Once you have configured the services you will want to setup Renovate to ensure your dependencies remain up to date. In order to do this you will need to run Renovate in a crontab. I run mine once a day but obviously this is up to you.

Here is the crontab I run each day to go through my repositories.

<script src="https://gist.github.com/johnnolan/09ffb59020202e9e307b7f28289ddadd.js?file=crontab.sh"></script>
