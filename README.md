# Mock Test Platform

A production-minded Phase 1 foundation for a mock test platform focused on government and private job preparation.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Next.js API routes and Prisma ORM
- Database: MongoDB
- Infrastructure: Docker Compose, Prisma

## Prerequisites

Before starting, install:

- Node.js LTS
- npm
- Docker
- Docker Compose

## Installation

```bash
npm install
```

Copy the environment example file and update values if needed:

```bash
copy .env.example .env
```

## Start MongoDB

```bash
docker compose up -d
```

## Prisma

Generate the Prisma client and sync the schema to MongoDB:

```bash
npx prisma generate
npx prisma db push
```

## Start Application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Health API

```text
GET http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "UP",
  "service": "mock-test-platform",
  "database": "UP"
}
```

## Project Structure

```text
mock-test-platform/
├── app/
│   ├── api/
│   │   └── health/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── backend-status.tsx
├── lib/
│   ├── env.ts
│   ├── prisma.ts
│   └── api.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── .gitignore
├── docker-compose.yml
├── next.config.ts
├── package.json
├── README.md
├── tsconfig.json
└── ...
```

## Authentication and admin flow

The platform includes a basic authentication layer and admin-managed question creation.

- Admin login: `admin@mocktest.local`
- Admin password: `Admin@123`
- Admin dashboard: `http://localhost:3000/admin`
- User practice area: `http://localhost:3000/questions`

Admins can create mock-test questions from the admin dashboard. They can also bulk import a CSV file to create multiple questions and optionally generate a mock test in one step. Logged-in users can attempt questions and receive an instant score when they submit their answers.

### CSV mock test import

Use the admin dashboard to upload a CSV containing these columns:

```csv
questionText,optionA,optionB,optionC,optionD,correctOption,category,difficulty,explanation
Which planet is known as the Red Planet?,Mercury,Venus,Mars,Jupiter,A,CGL General Awareness,MEDIUM,Mars is known as the Red Planet due to iron oxide on its surface.
```

The upload flow will:

- create the questions in the question bank
- optionally create a mock test from those imported questions
- publish the test immediately if the checkbox is enabled

## Google OAuth

To enable real Google sign in, add the following values to your `.env` file:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Then create a Google OAuth client in the Google Cloud Console, set the authorized redirect URI to the callback above, and sign in from the login or signup page.

## Notes

This project is intentionally focused on the foundational platform layer and is now configured for MongoDB as the local database.
