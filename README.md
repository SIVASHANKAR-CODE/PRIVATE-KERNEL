# PRIVATE KERNEL

A production‑ready Progressive Web App for secure, real‑time private messaging.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, Socket.IO client
- **Backend**: Node.js, Express, TypeScript, Socket.IO
- **Database**: MongoDB (Mongoose)
- **File Storage**: Configurable local filesystem or any S3‑compatible provider
- **PWA**: Manifest, Service Worker, installable on desktop & mobile

## Repository Structure

```
PRIVATE-KERNEL/
├── frontend/          # React + Vite app
├── backend/           # Express API + Socket.IO server
├── .env.example       # Environment variable template
├── docker-compose.yml # Development stack (MongoDB, optional MinIO)
├── README.md          # This file
└── .gitignore
```

## Getting Started

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd PRIVATE-KERNEL
   ```
2. **Create an environment file**
   ```bash
   cp .env.example .env
   # Fill in the values (MongoDB URI, JWT secret, etc.)
   ```
3. **Install dependencies**
   ```bash
   # Using npm workspaces (or run separately in each folder)
   npm install
   ```
4. **Run the development stack**
   ```bash
   docker-compose up -d   # Starts MongoDB (and MinIO if configured)
   npm run dev            # Starts both frontend and backend (see scripts)
   ```
5. **Open the app**
   Visit `http://localhost:5173` (Vite dev server).

## Scripts

- `npm run dev` – Starts both frontend and backend in watch mode.
- `npm run build` – Builds production assets for both sides.
- `npm run test` – Runs backend and frontend tests.

## Contributing

Please follow the **Implementation Plan** (see `implementation_plan.md`) for the development order, coding conventions, and security guidelines.
