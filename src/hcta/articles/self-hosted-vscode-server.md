---
layout: layouts/article.njk
title: "Self-hosted Visual Studio Code Server with pre-installed development tooling"
description: "How to setup and run your own self-hosted Visual Studio Code Server with pre-installed development tooling."
image: "assets/posts/johnnolan.jpg"
date: 2025-07-31
tags: 
  - hcta
  - architecture
  - selfhosted
contributors: ["John Nolan"]
---

## Show me the code

You can find the `docker-compose.yml` and `Dockerfile` in this gist [https://gist.github.com/johnnolan/06dc558b55649d1c9e1f6d6a7afebbfd](https://gist.github.com/johnnolan/06dc558b55649d1c9e1f6d6a7afebbfd).

## Introduction

I use a lot of different operating systems and computers, anything from Windows, Linux, Chromebooks, Android Phone and Macs. Until recently I have just maintained one computer for writing code. Setting up the tooling required in each OS is a nightmare and some, like the Chromebook, are just not possible to do.

I have recently been playing with builing a self-hosted server at home. This has allowed me to install the following tooling locally

* [Gitea](https://about.gitea.com/) (GitHub clone)
* [Woodpecker CI](https://woodpecker-ci.org/) (CI/CD)
* [Docker Registry](https://hub.docker.com/_/registry) (Self-hosted Docker Registry)
* [Renovate](https://hub.docker.com/r/renovate/renovate) (Dependency management)

> For how to build this stack, see the article [Self-Hosted Development Pipeline Setup](../self-hosted-development-pipeline/)
  
With these tools installed, I have been able to run a completely isolated and self-hosted development pipeline from my own house.

But what about a dedicated virtual development environment so I could develop on any device from anywhere in the world in a consitent manner?

Could I run something that gave me similar features to GitHub Codespaces?

## Visual Studio Code Server

I quickly discovered I could use a self-hosted version of Visual Studio Code Server. Visual Studio Code Server is a service that allows you to run a virtual machine preconfigured with a Visual Studio web interface, to have a stable and consistent development environment across devices.

This means if I am on my Chromebook, I can connect via the browser and on my windows machine connect via the VS Code application. Both will provide me with the exact same environment without the difficulties of configuring each locally on the machine.

[![Strategy](/assets/posts/selfhosted/vscodeserver.png)](/assets/posts/aselfhosted/vscodeserver.png)

## The Dockerfile

The standard Dockerfile used [https://hub.docker.com/r/linuxserver/code-server/](https://hub.docker.com/r/linuxserver/code-server/) will provide you with the web interface and some basic tooling installed. But you will quickly reach the limits of what is installed on the container.

For my personal projects I needed to run

- yarn
- npm
- node
- pa11y
- puppeteer
- Jest
- Typescript
- terraform

Yes. I do enjoy the web dev life.

I also like to have some default alias's setup in my environment to make it quicker to run common commands from the Terminal.

- `terraform` = `tf` e.g. `tf plan`
- `yarn run` = `yr` e.g. `yr build`
- `git status` = `gst`

In order for all this to be available, I created my own Dockerfile using `FROM lscr.io/linuxserver/code-server:latest` as the base image. See the following code for how this looks. You can easily take this and add/replace with your needs.

<script src="https://gist.github.com/johnnolan/06dc558b55649d1c9e1f6d6a7afebbfd.js?file=Dockerfile"></script>

## docker-compose.yml

In order to run this docker image, you can use the following docker-compose.yml replacing your volume path and repository to where you store your image.

<script src="https://gist.github.com/johnnolan/06dc558b55649d1c9e1f6d6a7afebbfd.js?file=docker-compose.yml"></script>

## Build Pipeline

See the article [Self-Hosted Development Pipeline Setup](../self-hosted-development-pipeline/) for the full setup.

As mentioned at the start of this article, I already have a local development pipeline running, so doing the following steps I am able to completely automate the build.

<script src="https://gist.github.com/johnnolan/06dc558b55649d1c9e1f6d6a7afebbfd.js?file=.woodpecker.yml"></script>

1. Create a new Git repository to store the Dockerfile and .woodpecker.yml file
2. Allow Woodpecker CI to build the Docker image and upload to my self-hosted Docker repository
3. Create a new Git repository for the docker-compose.yml file and create a .woodpecker.yml file for the build steps
4. Woodpecker runs docker compose up referencing the latest version of the Docker image
5. To maintain auto deployment, run Renovate on a crontab on the self-hosted server
6. When renovate finds an updated Docker image version it will automatically create a Pull Request and auto merge, redeploying the VS Code Server

Using this setup, I can now amend the Dockerfile to add new or update versions of existing dependencies. Upon a build of the new image, my VS Code server will auto update and deploy without any manual steps.

All of these steps can be replicated in any other CI/CD setup of course and be done in cloud services such as AWS, Azure and GCP.
