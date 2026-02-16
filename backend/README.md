# SkySphere Backend API

This is the backend service for the SkySphere Drone Survey Management System. It is built with Node.js, Express, and TypeScript, using PostgreSQL as the database and Prisma as the ORM.

## Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Real-time**: Socket.io
-   **Geospatial**: Turf.js
-   **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

-   Node.js (v18+)
-   PostgreSQL (v14+)
-   npm

## Getting Started

### 1. Installation

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the root of the backend directory. You can copy the example if available, or use the following template:

```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/skysphere_db?schema=public"
JWT_SECRET="your-super-secret-key-change-this-in-production"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 3. Database Setup

Ensure your PostgreSQL instance is running and the database URL is correct.

Generate Prisma client:
```bash
npm run prisma:generate
```

Run migrations to set up the schema:
```bash
npm run prisma:migrate
```

Seed the database with initial data (users, drones, etc.):
```bash
npm run prisma:seed
```

### 4. Running the Server

#### Development Mode
Runs the server with hot-reload using `tsx watch`:
```bash
npm run dev
```
The server will start at `http://localhost:3001`.

#### Production Build
Build the TypeScript code to JavaScript:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Scripts

-   `npm run dev`: Start development server
-   `npm run build`: Compile TypeScript to `dist/`
-   `npm start`: Start production server from `dist/`
-   `npm run prisma:studio`: Open Prisma Studio to view database
-   `npm run prisma:generate`: Generate Prisma Client
-   `npm run prisma:migrate`: Run database migrations
-   `npm run prisma:seed`: Seed database

## API Overview

### Authentication
-   `POST /api/auth/register` - Create a new account
-   `POST /api/auth/login` - Login and receive JWT

### Drones
-   `GET /api/drones` - List all drones
-   `POST /api/drones` - Register a new drone
-   `GET /api/drones/:id` - Get drone details

### Missions
-   `GET /api/missions` - List all missions
-   `POST /api/missions` - Create a new mission plan
-   `POST /api/missions/:id/execute` - Start a mission

### Real-time Events (Socket.io)
The server emits events for mission updates:
-   `mission:progress`: Real-time telemetry and status
-   `mission:status`: Status changes (started, paused, completed)

## Project Structure

```
src/
├── config/         # Database and WebSocket configuration
├── controllers/    # Request handlers
├── middleware/     # Auth and error handling middleware
├── routes/         # API route definitions
├── services/       # Business logic (Telemetry, Geospacial)
├── server.ts       # Application entry point
└── types/          # TypeScript type definitions
```
