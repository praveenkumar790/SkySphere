<div align="center">

#  SkySphere

### Drone Survey Management System

**Plan missions. Deploy drones. Monitor in real-time. Analyze results.**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Role-Based Access Control](#-role-based-access-control)
- [Real-Time Features](#-real-time-features)
- [Data Flow](#-data-flow)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)

---

## 🌐 Overview

SkySphere is a **full-stack, multi-tenant SaaS platform** for managing drone survey missions from start to finish. It provides everything a team needs to operate a drone fleet — from drawing a survey area on a map to receiving a detailed analytics report after the flight.

> Think of it as **mission control for drones**: plan, assign, watch, and report — all in one place.

**What users can do:**
- 🗺️ Draw survey areas on an interactive map and auto-generate waypoints
- 🚁 Assign drones to missions and launch them with one click
- 📡 Watch drones fly live with second-by-second telemetry updates
- 📊 Review detailed post-mission reports with coverage stats and charts
- 👥 Manage team members with role-based access control

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Mission Planning** | Draw polygons on an interactive map; the system auto-generates optimized flight waypoints |
| **3 Survey Patterns** | Crosshatch, Perimeter, and Grid — each computed with geospatial algorithms via Turf.js |
| **Live Mission Monitoring** | Real-time drone position, battery, speed, altitude, and ETA via WebSockets |
| **Mission Control** | Pause, resume, or abort any active mission from the dashboard |
| **Automated Reports** | Survey reports auto-generated on mission completion with distance, area, and duration stats |
| **Fleet Management** | Track every drone's status, battery level, and GPS coordinates |
| **Team Management** | Add team members, assign roles, and control platform-wide permissions |
| **Multi-Tenancy** | Organizations are fully isolated — users only ever see their own data |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  React App  │  │   Axios API  │  │  Socket.io Client      │ │
│  │  (Vite)     │──│   Service    │  │  (Real-time updates)   │ │
│  └─────────────┘  └──────┬───────┘  └───────────┬────────────┘ │
└──────────────────────────┼──────────────────────┼──────────────┘
                           │ HTTP (REST)           │ WebSocket
                           ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND SERVER                            │
│                                                                 │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────────────┐   │
│  │  Express │  │Controllers │  │  Telemetry Simulator      │   │
│  │  Router  │──│ (Handlers) │  │  (Simulates drone flight) │   │
│  └──────────┘  └─────┬──────┘  └──────────┬────────────────┘   │
│                       └────────────────────┘                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Prisma ORM (Database Access)            │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└───────────────────────────── ┼ ──────────────────────────────────┘
                               ▼
                     ┌──────────────────┐
                     │  PostgreSQL DB   │
                     └──────────────────┘
```

**Key design decisions:**
- **Multi-tenancy** is enforced at the query level via `organizationId` embedded in the JWT — no cross-tenant data leakage is possible.
- **WebSockets** (Socket.io) push telemetry to subscribed clients every 2 seconds — no polling needed.
- **Telemetry Simulator** runs server-side, interpolating position between waypoints and draining battery realistically until the final waypoint is reached.

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | Server runtime and REST API framework |
| **TypeScript** | Type-safe JavaScript across the codebase |
| **PostgreSQL** | Primary relational database |
| **Prisma ORM** | Database access, migrations, and schema management |
| **Socket.io** | Real-time bidirectional WebSocket communication |
| **Turf.js** | Geospatial calculations for waypoint generation |
| **JWT** | Stateless authentication tokens |
| **bcrypt** | Secure password hashing (10 salt rounds) |
| **Zod** | Schema validation for all API inputs |

### Frontend

| Technology | Purpose |
|---|---|
| **React 18 + Vite** | UI library and fast build/dev server |
| **TypeScript** | Type-safe components and API contracts |
| **Tailwind CSS** | Utility-first styling |
| **React Router v6** | Client-side routing with protected routes |
| **Zustand** | Lightweight global state management |
| **Axios** | HTTP client with auth interceptors |
| **Socket.io Client** | Real-time WebSocket connection |
| **Leaflet** | Interactive map for mission planning and monitoring |
| **Recharts** | Charts and analytics visualizations |
| **Framer Motion** | Page transitions and animations |
| **Radix UI** | Accessible, unstyled UI primitives |
| **Lucide React** | Icon library |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v14 or higher
- **npm**

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/skysphere.git
cd skysphere
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/skysphere"
JWT_SECRET="your-super-secret-key-change-this"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

Run database setup and start the server:

```bash
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Apply database migrations
npm run prisma:seed         # Seed with demo data
npm run dev                 # Start dev server on port 3001
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

Start the development server:

```bash
npm run dev                 # Start on http://localhost:5173
```

### 4. Demo Login

Open `http://localhost:5173` and log in with:

```
Email:    demo@skysphere.com
Password: demo123
```

---

## 📡 API Reference

All routes require `Authorization: Bearer <token>` unless marked as public.

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|:---:|
| `POST` | `/register` | Create a new account and organization | ❌ |
| `POST` | `/login` | Login and receive a JWT token | ❌ |
| `GET` | `/me` | Get the currently authenticated user | ✅ |

### Drones — `/api/drones`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all drones in the organization |
| `GET` | `/:id` | Get a specific drone by ID |
| `POST` | `/` | Register a new drone |
| `PUT` | `/:id` | Update drone status or details |
| `DELETE` | `/:id` | Remove a drone |

### Missions — `/api/missions`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all missions |
| `GET` | `/:id` | Get full mission details |
| `POST` | `/` | Create a new mission plan |
| `PUT` | `/:id` | Update a mission |
| `DELETE` | `/:id` | Delete a mission |
| `POST` | `/generate-waypoints` | Generate flight path waypoints for a polygon |
| `POST` | `/:id/execute` | Start a mission with a given drone |
| `GET` | `/:id/executions` | Get all executions for a mission |
| `GET` | `/history` | Get full execution history |

### Execution Control — `/api/executions`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:id` | Get execution details |
| `POST` | `/:id/pause` | Pause a running mission |
| `POST` | `/:id/resume` | Resume a paused mission |
| `POST` | `/:id/abort` | Abort a mission |

### Reports — `/api/reports`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all survey reports |
| `GET` | `/statistics` | Get organization-wide aggregate stats |
| `GET` | `/:id` | Get a specific report |

### Team — `/api/users`

| Method | Endpoint | Description | Required Role |
|---|---|---|---|
| `GET` | `/` | List all team members | `ORG_ADMIN+` |
| `POST` | `/` | Add a new team member | `ORG_ADMIN+` |
| `PUT` | `/:id` | Update a member's role | `ORG_ADMIN+` |
| `DELETE` | `/:id` | Remove a team member | `ORG_ADMIN+` |

---

## 🔐 Role-Based Access Control

Every user belongs to one of four roles. Permissions are enforced server-side on every request.

| Action | `SUPER_ADMIN` | `ORG_ADMIN` | `OPERATOR` | `VIEWER` |
|---|:---:|:---:|:---:|:---:|
| View drones & missions | ✅ | ✅ | ✅ | ✅ |
| Create & edit drones | ✅ | ✅ | ✅ | ❌ |
| Execute missions | ✅ | ✅ | ✅ | ❌ |
| Pause / Abort missions | ✅ | ✅ | ✅ | ❌ |
| Manage team members | ✅ | ✅ | ❌ | ❌ |

> Multi-tenancy is enforced at the query level. `organizationId` is embedded in the JWT and applied to every database query — users can never access another organization's data.

---

## 📡 Real-Time Features

SkySphere uses **Socket.io** for live mission monitoring. When a mission starts, the server pushes updates every 2 seconds to all subscribed frontend clients — no polling required.

### WebSocket Events

| Event | Direction | Payload |
|---|---|---|
| `subscribe:mission` | Client → Server | `{ executionId }` |
| `unsubscribe:mission` | Client → Server | `{ executionId }` |
| `mission:progress` | Server → Client | position, battery, speed, heading, ETA, waypointIndex |
| `mission:started` | Server → Client | execution details |
| `mission:completed` | Server → Client | final stats |
| `mission:paused` | Server → Client | — |
| `mission:resumed` | Server → Client | — |
| `mission:aborted` | Server → Client | — |

> **Note for production:** Vercel's serverless functions do not support persistent WebSocket connections. For production deployments with real-time features, deploy the backend on **Railway** or **Render**.

---

## 🔄 Data Flow

The complete lifecycle of a drone mission, end to end:

```
1. User draws a polygon on the map (Mission Planning)
         │
         ▼
2. POST /api/missions/generate-waypoints
   → waypoint-generator.service.ts computes GPS points via Turf.js
   → Waypoints are previewed on the map
         │
         ▼
3. POST /api/missions  →  Mission saved to the database
         │
         ▼
4. POST /api/missions/:id/execute (with droneId)
   → MissionExecution record created
   → Drone status set to "in-mission"
   → TelemetrySimulator starts
         │
         ▼
5. Every 2 seconds — TelemetrySimulator:
   - Interpolates drone position between waypoints
   - Calculates battery drain, heading, ETA
   - Saves Telemetry record to DB
   - Broadcasts mission:progress via WebSocket
         │
         ▼
6. Frontend useMissionMonitor hook receives updates
   → Map, telemetry panel, and progress bar update live
         │
         ▼
7. Final waypoint reached:
   - Execution marked "completed"
   - SurveyReport created (distance, area, duration, battery)
   - mission:completed event broadcast
   - Drone status reset to "available"
```

---

## ⚙️ Environment Variables

### Backend — `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/skysphere` |
| `JWT_SECRET` | Secret key for signing tokens | `your-super-secret-key` |
| `PORT` | Server listening port | `3001` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

### Frontend — `frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend REST API base URL | `http://localhost:3001` |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:3001` |

---

## 🚢 Deployment

Both `frontend/` and `backend/` include `vercel.json` configuration for one-click Vercel deployment.

For detailed deployment instructions (Vercel, Railway, Render), see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

### Quick Deployment Notes

| Platform | Frontend | Backend |
|---|---|---|
| **Vercel** | ✅ Full support | ⚠️ No persistent WebSockets |
| **Railway** | ✅ | ✅ Full support (recommended) |
| **Render** | ✅ | ✅ Full support |

---

## 📂 Project Structure

```
skysphere/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (9 models)
│   │   ├── migrations/          # Migration history
│   │   └── seed.ts              # Demo data seeder
│   └── src/
│       ├── config/
│       │   ├── database.ts      # Prisma client singleton
│       │   └── websocket.ts     # Socket.io setup + broadcast helpers
│       ├── controllers/         # Route handlers (auth, drones, missions, reports, users)
│       ├── middleware/
│       │   ├── auth.middleware.ts    # JWT verification + RBAC
│       │   └── error.middleware.ts  # Global error handler
│       ├── routes/              # Express route definitions
│       ├── services/
│       │   ├── waypoint-generator.service.ts  # Turf.js flight path algorithms
│       │   └── telemetry-simulator.service.ts # Drone flight simulation
│       └── server.ts            # Application entry point
│
└── frontend/src/
    ├── components/
    │   ├── landing/             # Public landing page sections
    │   ├── ui/                  # 17 reusable Radix UI components
    │   └── layout/              # Page transition wrappers
    ├── context/
    │   └── AuthContext.tsx      # Authentication state provider
    ├── hooks/
    │   ├── useMissions.ts       # Auto-fetch missions + drones
    │   └── useWebSocket.ts      # Real-time mission subscription
    ├── pages/                   # Dashboard, Missions, Monitor, Reports, Team
    ├── services/
    │   ├── api.ts               # Axios instance with auth interceptors
    │   └── websocket.ts         # Socket.io client singleton
    ├── store/
    │   └── missionStore.ts      # Zustand global state
    └── App.tsx                  # Root component + routing
```

---

### Database Schema at a Glance

```
Organization ─┬── Users
              ├── Sites
              ├── Drones ──── MissionExecutions ─┬── Telemetry (many readings)
              └── Missions ─┬── Waypoints        └── SurveyReport (one report)
                            └── MissionExecutions
```

---

<div align="center">

Built with ❤️ using React, Node.js, and PostgreSQL

</div>
