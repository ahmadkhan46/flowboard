# FlowBoard

A modern task board built with Next.js, Appwrite, and Zustand.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Appwrite (Auth, Database, Storage)
- Zustand (state management)
- dnd-kit (drag and drop)

## Features
- Kanban board with `To Do`, `In Progress`, `Done` lanes
- Drag and drop task movement
- Create, edit, delete tasks
- Task description and priority (`low`, `medium`, `high`)
- Optional image uploads per task
- Import / export tasks via CSV
- Guest mode + email/password auth
- Guest-task migration when user signs in/signs up
- User-isolated data (`ownerId`-based filtering)

## Prerequisites
- Node.js 24.x (recommended)
- npm 10+
- Appwrite Cloud project

## Environment Variables
Create `.env.local`:

```bash
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_DATABASE_ID=
NEXT_PUBLIC_TODOS_COLLECTION_ID=
NEXT_PUBLIC_IMAGES_BUCKET_ID=
```

The app validates these vars on `npm run dev` and `npm run build`.

## Appwrite Setup

### 1) Auth
In `Auth -> Settings / Methods`:
- Enable `Email/Password`
- Enable `Anonymous` (recommended)

### 2) Platforms
In `Project -> Settings -> Platforms`, add your web hostnames (one platform per hostname), for example:
- `flowboard.vercel.app`
- `flowboard-yourteam.vercel.app`

### 3) Database
Create a database and a tasks table/collection with at least:
- `title` (string, required)
- `status` (string, required) values used: `todo | inprogress | done`
- `description` (string, optional)
- `priority` (string, optional) values used: `low | medium | high`
- `image` (string, optional) stores JSON `{ bucketID, fieldID }`
- `ownerId` (string, required)

Permissions:
- Enable row/document security
- Table-level `Create`: allow authenticated users
- Avoid broad `Any` read if you want strict user privacy

### 4) Storage
Create a bucket for task images and set read/write as needed for your auth model.

## Local Development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts
- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production build locally
- `npm run lint` - lint project
- `npm run check-env` - verify required env vars
- `npm run diagnose:appwrite` - diagnose Appwrite connectivity/permissions

## Deploy (Vercel)
1. Set the same env vars in Vercel Project Settings.
2. Ensure Vercel Node.js version is `24.x`.
3. Deploy:

```bash
npx vercel --prod
```

## Latest Updates
- Rebranded project identity to **FlowBoard** (UI metadata, package naming, docs).
- Replaced external Trello-branded header logo with a custom neutral FlowBoard mark.
- Improved drag-and-drop handling and overall board UX polish.
- Added CSV import/export improvements:
  - Header-based parsing
  - Case-insensitive priority parsing
  - Optional image URL import support
- Added auth reliability improvements:
  - Sign-in now handles active guest sessions automatically
  - Fallback auth dialog shown even if anonymous session fails
- Added guest-to-account task migration on successful sign-in/sign-up.
- Enforced per-user task isolation using `ownerId` filtering.
- Added startup diagnostics/scripts for env and Appwrite connectivity.

## Notes
- Existing tasks created before `ownerId` rollout may need migration (set `ownerId` per row or recreate/import tasks).
- If sign-in fails with an active guest session, the app now auto-replaces current session and retries.
