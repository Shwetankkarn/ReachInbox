


\


\<div align="center">

# ✦ ReachInbox

### Reliable email scheduling. Persistent jobs. Controlled delivery.

\<img src="[https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=2800&pause=900&color=FF9900&center=true&vCenter=true&width=720&lines=Deployed+on+AWS+EC2;Schedule+emails+with+BullMQ+and+Redis;Rate+limiting+with+Slack+notifications;Searchable+email+records+with+Elasticsearch](https://readme-typing-svg.demolab.com?font=Fira+Code\&size=18\&duration=2800\&pause=900\&color=FF9900\&center=true\&vCenter=true\&width=720\&lines=Deployed+on+AWS+EC2;Schedule+emails+with+BullMQ+and+Redis;Rate+limiting+with+Slack+notifications;Searchable+email+records+with+Elasticsearch)" alt="ReachInbox animated tagline" />

[**Live App**](https://reach-inbox-pearl-chi.vercel.app/) · [**GitHub Repository**](https://github.com/Shwetankkarn/ReachInbox)

\</div>

> A full-stack email scheduling application that processes delayed jobs, persists queue state, enforces email rate limits, sends Slack notifications when limits are reached, and indexes email records for search.

## ✨ Project Overview

ReachInbox is a full-stack email scheduler built to explore reliable background job processing and cloud deployment. Users can schedule emails for a future time while a BullMQ worker processes jobs according to configured concurrency and rate limits.

## ☁️ AWS Deployment

**The backend is deployed on an Amazon EC2 Ubuntu instance.** The frontend is deployed on Vercel.

| Component           | Deployment / Technology       |
| ------------------- | ----------------------------- |
| Frontend            | Vercel                        |
| Backend API         | Amazon EC2 · Ubuntu · Node.js |
| Process management  | systemd                       |
| Job queue           | BullMQ + Redis                |
| Database            | PostgreSQL                    |
| Search engine       | Elasticsearch                 |
| Email testing       | Ethereal Email + Nodemailer   |
| Notifications       | Slack API                     |
| Supporting services | Docker Compose                |

### Deployment links

- **Frontend:** [Open ReachInbox](https://reach-inbox-pearl-chi.vercel.app/)
- **Source code:** [GitHub Repository](https://github.com/Shwetankkarn/ReachInbox)

The backend is managed as a systemd service on EC2. PostgreSQL and Redis are configured to bind to localhost, and Docker Compose manages the supporting infrastructure.

> Note: The backend has also been exposed through a Cloudflare Quick Tunnel for testing. Quick Tunnel URLs can change, so a stable public API URL or custom domain should be configured before publishing a permanent API link.

## 🚀 Key Features

- **Email scheduling:** Schedule email jobs for a specified date and time.
- **Persistent job queue:** Use BullMQ delayed jobs backed by Redis.
- **Background processing:** Configure worker concurrency through environment settings.
- **Rate limiting:** Enforce hourly sending limits and minimum delays between emails.
- **Automatic rescheduling:** Delay jobs when rate limits prevent immediate processing.
- **Slack notifications:** Notify Slack when an email rate limit is reached.
- **Database persistence:** Store email records and scheduling information in PostgreSQL.
- **Email search:** Index and search email records using Elasticsearch.
- **Queue monitoring:** Inspect job states through Bull Board.
- **Cloud deployment:** Run the backend on AWS EC2 and host the frontend on Vercel.

## 🏗️ Architecture

```text
                 ┌──────────────────────┐
                 │   React Frontend     │
                 │       Vercel         │
                 └──────────┬───────────┘
                            │ HTTPS
                            ▼
                 ┌──────────────────────┐
                 │ Express API on EC2   │
                 │       Ubuntu         │
                 └──────────┬───────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        PostgreSQL        Redis      Elasticsearch
        Email records   BullMQ jobs   Email search
                            │
                            ▼
                    ┌───────────────┐
                    │ BullMQ Worker │
                    └───────┬───────┘
                            │
                    ┌───────┴────────┐
                    ▼                ▼
              Ethereal SMTP     Slack Alerts
              Test emails       Rate-limit alerts
```

## 🛠️ Tech Stack

| Category         | Technologies                    |
| ---------------- | ------------------------------- |
| Frontend         | React, TypeScript, Tailwind CSS |
| Backend          | Node.js, Express.js, TypeScript |
| Queue processing | BullMQ, Redis                   |
| Database         | PostgreSQL                      |
| Search           | Elasticsearch                   |
| Email            | Nodemailer, Ethereal Email      |
| Notifications    | Slack API, OAuth                |
| Infrastructure   | AWS EC2, Ubuntu, Docker Compose |
| Deployment       | Vercel, systemd                 |
| Version control  | Git, GitHub                     |

## ⚙️ Local Setup

### Prerequisites

- Node.js compatible with the project configuration
- npm
- Docker and Docker Compose
- Environment credentials for the services you configure

### 1. Clone the repository

```bash
git clone https://github.com/Shwetankkarn/ReachInbox.git
cd ReachInbox
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create the required environment configuration files based on the variables used by the API and frontend.

Configure your PostgreSQL connection, Redis connection, Elasticsearch URL, session secrets, Google OAuth, Slack OAuth and SMTP settings as applicable.

**Never commit `.env` files, passwords, access tokens or OAuth secrets to GitHub.**

### 4. Start supporting services

```bash
docker compose up -d
```

### 5. Build the backend

```bash
npm run build -w apps/api
```

Use the scripts defined in the repository's `package.json` to start the API and frontend in development mode.

## 📬 Email Delivery Notes

This project currently uses **Ethereal Email** for testing. Emails can be inspected using the preview URL generated by the backend.

Ethereal is a test SMTP service. A successful send does not mean the message has been delivered to a real recipient's inbox.

## 📊 Queue Monitoring

Bull Board provides a dashboard for inspecting job states, including:

- Waiting
- Active
- Delayed
- Completed
- Failed
- Paused

The dashboard is protected by authentication. Access it through the configured API deployment after logging in.

## 📚 Documentation

- [Amazon EC2](https://docs.aws.amazon.com/ec2/)
- [Docker Compose](https://docs.docker.com/compose/)
- [BullMQ](https://docs.bullmq.io/)
- [Redis](https://redis.io/docs/latest/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Elasticsearch](https://www.elastic.co/guide/index.html)
- [Nodemailer](https://nodemailer.com/)
- [Slack API](https://api.slack.com/)
- [Vercel](https://vercel.com/docs)

## 📁 Project Structure

```text
ReachInbox/
├── apps/
│   ├── api/              # Express API and background worker
│   └── web/              # Frontend application
├── docker-compose.yml    # Supporting infrastructure
├── package.json          # Workspace configuration
└── README.md
```

## 🎯 What I Learned

- Building persistent background job workflows with BullMQ and Redis.
- Managing concurrency and rate limits in asynchronous email processing.
- Integrating Slack OAuth and automated notifications.
- Using PostgreSQL for application data and Elasticsearch for search.
- Deploying a Node.js application on AWS EC2 with systemd.
- Managing supporting services with Docker Compose.
- Hosting a frontend on Vercel and connecting it to a deployed API.

---

\<div align="center">

**Built with ☁️ AWS, ⚙️ BullMQ and ❤️ TypeScript**

[⬆ Back to Top](#-reachinbox)

\</div>

