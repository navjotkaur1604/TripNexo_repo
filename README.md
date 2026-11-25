# TripNexo — Smart Rajasthan Travel Planning & Budget Platform

TripNexo is a full-stack **MERN** web application built from scratch for planning multi-destination trips across **Rajasthan, India**. It combines destination discovery, dynamic day-wise itinerary generation, transparent unit-based budget estimation, interactive OpenStreetMap routing, persistent MongoDB storage, PDF itinerary export, Redis caching, and a microservices + API Gateway + Docker architecture.

> **Disclaimer:** TripNexo is strictly a travel planning and budget-estimation platform, not a booking or payment platform. All cost ranges are indicative planning estimates in INR.

---

## Core Capabilities

- **Explore 20 Rajasthan Destinations**: Search and filter by region, travel interest, best season, maximum daily budget, and recommended duration with sorting and pagination (`Jaipur`, `Udaipur`, `Jodhpur`, `Jaisalmer`, `Pushkar`, `Mount Abu`, `Ajmer`, `Bikaner`, `Chittorgarh`, `Ranthambore`, `Kumbhalgarh`, `Bundi`, `Ranakpur`, `Nathdwara`, `Bharatpur`, `Alwar`, `Sariska`, `Mandawa`, `Barmer`, `Kota`).
- **Smart Trip Planner**: Add, remove, and reorder destinations, override durations, set pace (`relaxed`, `balanced`, `packed`), generate duplicate-free day-wise schedules in the backend, edit activities/notes, and persist to MongoDB.
- **Unit-Consistent Budget Calculator**: Estimates accommodation (`room rate × rooms × nights`, up to 3 people/room), food (`per-person daily rate × effective travellers × days`), transport (`per-person` for public vs `per-vehicle` for cab/self-drive), shared safari jeep capacities, automatic intercity leg calculations, budget warnings, and Recharts comparisons.
- **Interactive Map**: Leaflet + OpenStreetMap showing city hubs, attraction markers, and coordinate sequence polylines.
- **User Accounts & Dashboard**: JWT + bcrypt authentication, Multer profile image upload (with local & configurable S3 cloud storage adapter), favourite destinations, and My Trips Dashboard (view, edit, duplicate, delete, recalculate budget, export PDF).
- **Advanced Backend (ETE)**: API Gateway (`http-proxy-middleware`), 4 logical microservices (Auth, Destinations, Trips, Budget), Redis cache-aside with TTL & invalidation + graceful fallback, Winston + Morgan structured logging with secret redaction, Docker Compose, and GitHub Actions CI/CD.

---

## Project Structure

```text
tripnexo/
  client/                 # React 18 + Vite + Tailwind + Leaflet + Recharts + jsPDF
  server/
    config/               # env, MongoDB, Redis, Winston logger
    models/               # User, Destination, Trip, Itinerary, Review
    middleware/           # JWT protect/authorize, validation, Multer, Morgan, errors
    storage/              # Local & S3-compatible upload storage adapters
    services/
      core/               # itineraryGenerator.js & budgetCalculator.js
      auth/               # Auth microservice + controller/routes
      destinations/       # Destination microservice + Redis caching
      trips/              # Trip & Itinerary microservice
      budget/             # Budget microservice
    gateway/              # API Gateway + service discovery health aggregator
    monolith/             # Single-process Express app for CE-2 & integration tests
    data/                 # 20 curated Rajasthan destinations seed dataset
    scripts/              # seedDestinations.js
    tests/                # Jest + Supertest suites
  docker/                 # Dockerfile.server, Dockerfile.client, nginx.conf
  .github/workflows/      # ci.yml (backend tests, syntax checks, client tests & build)
  docker-compose.yml
  .env.example
```

---

## Quick Start (Local Development)

1. **Prerequisites**: Node.js 20+, MongoDB (local `mongodb://127.0.0.1:27017/tripnexo` or MongoDB Atlas URI), optional Redis (`redis://127.0.0.1:6379`).
2. **Environment setup**:
   ```bash
   cp .env.example .env
   ```
3. **Install dependencies**:
   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```
4. **Seed Rajasthan destinations**:
   ```bash
   npm run seed
   ```
5. **Run in Monolith + Vite mode** (CE-2 evaluation):
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`, API at `http://localhost:5000/api`.
6. **Run in Microservices + API Gateway mode** (ETE evaluation):
   ```bash
   npm run dev:microservices
   ```

---

## Running with Docker Compose

```bash
docker compose up --build
```
- Frontend (Nginx): `http://localhost:3000`
- API Gateway: `http://localhost:5000/api/health`
- MongoDB: `27017` | Redis: `6379`

---

## Running Tests & Production Build

```bash
# Backend Jest + Supertest suite
npm --prefix server test

# Frontend Vitest + React Testing Library suite
npm --prefix client test

# Frontend Vite production build
npm run build
```
