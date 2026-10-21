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
