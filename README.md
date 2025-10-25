## Overview

**Watchtower** is a robust, production-grade platform designed to monitor, manage, and automate infrastructure across multiple servers from a single, central dashboard.

It combines:

* **Agent-based data collection** (lightweight Go binaries installed on remote servers)
* **Centralized configuration & control** ([ReactJS](https://react.dev/))
* **Real-time alerting and automation** ([Redis](https://redis.io/) + Go worker engine)
* **Database-backed persistence** ([PostgreSQL](https://www.postgresql.org/))

With Watchtower, users can deploy monitoring agents, collect system metrics, configure custom events, in order to manage multiple servers from a single dashboard and/or command line interface

---

## Problem Statement

Modern companies run many servers, services, and jobs. When something goes wrong (server overload, service downtime, security event), teams need:

* Immediate detection (before users notice)
* Real-time notifications & escalation
* Automated recovery workflows
* Centralized visibility into all incidents

Existing tools like [PagerDuty](https://www.pagerduty.com/), [Datadog](https://www.datadoghq.com/), and [Ansible](https://docs.ansible.com/) are powerful but expensive and often overly complex for smaller teams.

**Watchtower** offers an open-source, lightweight alternative that combines monitoring, incident management, and remote orchestration.

---

## Architecture

 - Diagram of architecture can be found **[HERE](https://drive.google.com/file/d/1M5uuJO1P3fCySoNSBnkVTFyPqVh9pYCr/view?usp=drive_link)**, can be opened on [Draw.io](http://draw.io).

| Component           | Tech Stack                 | Function                                                                 |
| ------------------- | -------------------------- | ------------------------------------------------------------------------ |
| **Admin Dashboard** | ReactJS                    | Manage servers, alert rules, view incidents, trigger deployments         |
| **Incident Engine** | Go (goroutines, channels)  | Real-time event ingestion, alert routing, auto-remediation               |
| **Database**        | PostgreSQL                 | Stores configuration, users, incidents, logs                             |
| **Cache**   | Redis                      | Event deduplication, queues, timers for escalations                      |
| **Agent**           | Go (cross-compiled binary) | Collects metrics (CPU, memory, disk, logs) and reports to central server |

---

## Deployment Flow

1. **User adds a server** in the Admin UI.
2. **Watchtower connects via SSH** to the remote host.
3. Installs **Agent binary** and registers it as a system service.
4. Agent starts collecting data and **sends JSON payloads** back to Watchtower.
5. Data is processed, stored, and matched against **alerting rules**.
6. If thresholds are breached → **notifications + auto-remediation** trigger.
---

## Features

- **Multi-Server Agent Deployment** – One-click install via SSH from the central UI/CLI.
- **Real-Time Metric Collection** – CPU, memory, disk, process monitoring.
- **Event-Based Alerting** – Execute tasks when an event occurs.
- **Incident Dashboard** – View open incidents, acknowledgements, resolution times.
- **Auto-Remediation** – Run custom scripts on affected servers automatically.
- **CLI Tool** – Trigger test incidents or manually collect metrics

## Deployment
> [!CAUTION]
> Watchtower is still in active development and is not ready for productio servers, please be careful!
> 
1. Install Docker Images
   docker pull ghcr.io/mcdonaghmichael/watchtower-web:latest
   docker pull ghcr.io/mcdonaghmichael/watchtower-api:latest`

---
