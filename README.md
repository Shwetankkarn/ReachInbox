# ReachInbox – Email Scheduler

ReachInbox is a simple email scheduling application that lets users schedule emails for later instead of sending them manually at a specific time.

I built this project as part of the Outbox Labs assignment to practice working with background jobs, email scheduling, databases, and a full-stack application.

## What can you do with ReachInbox?

- Sign in using your Google account.
- Schedule emails to be sent at a selected date and time.
- View scheduled and sent emails from the dashboard.
- Upload recipient lists using CSV or TXT files.
- Search emails by their details.
- Track background jobs and see their current status.
- Switch between light and dark mode.

## How it works

After signing in, a user can compose an email, add recipients, and choose when it should be scheduled.

The application saves the email details in the database and adds a job to a background queue. A worker processes the job when it is due, while rate limits control how frequently emails can be sent.

For testing, the application uses Ethereal Email, which provides a preview of the generated email instead of delivering it like a regular production email service.

## Technologies used

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma
- **Background jobs:** BullMQ and Redis
- **Search:** Elasticsearch
- **Email testing:** Nodemailer and Ethereal Email
- **Authentication:** Google OAuth
- **Queue dashboard:** Bull Board

## Running the project locally

### Requirements

Make sure Node.js, npm, and Docker Desktop are installed.

### 1. Download the project

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ReachInbox
npm install
```

### 2. Start the required services

```bash
docker compose up -d
```

This starts the database, Redis, and Elasticsearch services configured for the project.

### 3. Set up environment variables

Create the required `.env` files using your local configuration. Add the database URL, Redis and Elasticsearch URLs, Google OAuth credentials, session secret, and rate-limit settings.

Do not upload `.env` files or private credentials to GitHub.

### 4. Start the backend

From the project root, run:

```bash
npm run dev:api
```

### 5. Start the frontend

Open another terminal in the project root and run:

```bash
npm run dev -w apps/web
```

Open the local URL shown in the terminal to use the application.

## A note about email delivery

This project currently uses Ethereal Email for testing. You can open the preview link printed in the backend terminal to inspect a generated email. It is not intended for sending real emails to recipients.


## Live Demo

- **Frontend:** [ReachInbox Dashboard](https://reach-inbox-pearl-chi.vercel.app/)
- **GitHub Repository:** [Shwetankkarn/ReachInbox](https://github.com/Shwetankkarn/ReachInbox)

## Deployment Architecture

The application uses a cloud-based deployment architecture:

- **Frontend:** Deployed on Vercel.
- **Backend API:** Node.js and Express.js running on an Ubuntu-based Amazon EC2 instance.
- **Process Management:** systemd manages the backend API service.
- **Database:** PostgreSQL stores application data.
- **Job Queue:** BullMQ uses Redis to schedule and process delayed email jobs.
- **Search:** Elasticsearch supports searching email records.
- **Email Testing:** Ethereal Email with Nodemailer provides test email previews.
- **Rate-Limit Notifications:** Slack integration sends notifications when email rate limits are reached.

### Infrastructure and Documentation

- [Amazon EC2](https://aws.amazon.com/ec2/)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Compose](https://docs.docker.com/compose/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/latest/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/index.html)
- [Slack API Documentation](https://api.slack.com/)
- [Nodemailer Documentation](https://nodemailer.com/)

## Key Features

- Schedule emails for a specific date and time.
- Process scheduled emails using persistent BullMQ jobs.
- Configure worker concurrency and email rate limits.
- Delay jobs when rate limits are reached.
- Send Slack notifications when rate limits are hit.
- Store email records in PostgreSQL.
- Index and search email records using Elasticsearch.
- Inspect background jobs using the Bull Board dashboard.
- Preserve queued jobs across application restarts using Redis persistence.

## Environment Configuration

Configure the required environment variables locally and on the server. Refer to the project's environment configuration and example files for the exact variable names.

Never commit `.env` files, passwords, API keys, OAuth client secrets, Slack tokens, or other credentials to GitHub.

## Running the Project

Install dependencies from the repository root:

```bash
npm install
```

Configure the required environment variables, then start the supporting services:

```bash
docker compose up -d
```

Build the API:

```bash
npm run build -w apps/api
```

For production deployment, configure the API service, database, Redis, Elasticsearch, OAuth credentials, and frontend API URL according to your environment.

## Important Notes

- Ethereal Email is a testing service; successful sending does not mean delivery to a real recipient's inbox.
- The Bull Board dashboard and API endpoints may require authentication.
- The API's public URL depends on the deployment and tunnel configuration. Use a stable HTTPS domain before documenting a permanent API URL.
- Keep production credentials out of source control.

## Project structure

```text
ReachInbox/
├── apps/
│   ├── api/
│   └── web/
├── docker-compose.yml
├── package.json
└── README.md
```

## Final note

This project helped me understand how email scheduling, background processing, rate limiting, database persistence, and search can work together in a full-stack application.
