# TripNexo System Architecture

## 1. High-Level Overview

TripNexo follows a modular MERN architecture designed to run seamlessly in two modes:
1. **Monolith Mode (`server/monolith/server.js`)** — Single Express process mounting all REST routes for streamlined local development, CE-2 evaluation, and Supertest integration testing.
2. **Microservices + API Gateway Mode (`server/gateway/server.js` + `server/services/*`)** — Independent Express processes behind a reverse-proxy API Gateway, communicating over Docker Compose internal DNS (`tripnexo-net`).

```text
[ React + Vite SPA ]
         |
         v  (HTTP /api/* & /uploads/*)
[ API Gateway :5000 ]  <-- Helmet, CORS, Rate Limiting, Morgan + Winston, /api/health
   |      |       |       |
   v      v       v       v
[Auth] [Dest]  [Trip]  [Budget]
:5001  :5002   :5003   :5004
   |      |  \    |       |
   |      v   \   |       |
   |   [Redis] \  |       |
   |   :6379    v v       v
   +---------> [ MongoDB :27017 ]
```

---

## 2. Service Boundaries & Service Discovery

- **Auth Service (`5001`)**: Registration, bcrypt password hashing, JWT issuance, profile management, favourite destinations, Multer avatar upload (`LocalStorageAdapter` / `CloudStorageAdapter`), and Admin endpoints.
- **Destination Service (`5002`)**: Curated Rajasthan catalog, query-parameter search/filtering/sorting/pagination, nearby coordinate distance calculation, Reviews CRUD + rating aggregation, and Redis cache-aside (`HIT` / `MISS` / `INVALIDATE`).
- **Trip & Itinerary Service (`5003`)**: Trip CRUD, ownership enforcement, dynamic itinerary generation (`itineraryGenerator.js`), day-schedule editing, duplication, and cascading deletion.
- **Budget Service (`5004`)**: Unit-consistent INR cost estimation (`budgetCalculator.js`) and tier comparison.

In Docker Compose, services discover one another via internal bridge network DNS names (`http://auth-service:5001`, `http://destination-service:5002`, `http://trip-service:5003`, `http://budget-service:5004`) injected through environment variables. Locally, they default to `http://127.0.0.1:5001..5004`.

---

## 3. Database Schema & Relationships (MongoDB + Mongoose)

- `User` (`users`): stores profile, hashed `password` (`select: false`), `role`, `profileImage`, and `favorites` (`ObjectId[] -> Destination`).
- `Destination` (`destinations`): stores Rajasthan city metadata, embedded `attractions[]`, `coordinates`, indicative cost structures, text index, and compound filter indexes.
- `Trip` (`trips`): references `User` (`userId`), `Destination` (`destinations[].destinationId`), and `Itinerary` (`itinerary[]`), plus `estimatedCost` snapshot.
- `Itinerary` (`itineraries`): references `Trip` (`tripId`) and `Destination` (`destination`) with compound unique index `{ tripId: 1, dayNumber: 1 }`.
- `Review` (`reviews`): references `User` (`userId`) and `Destination` (`destinationId`) with unique compound index `{ userId: 1, destinationId: 1 }`.

---

## 4. Redis Caching Strategy

1. `GET /api/destinations` and `GET /api/destinations/:id` check Redis first (`dest:list:<query>` / `dest:detail:<id>`).
2. On **cache miss**, data is queried from MongoDB, written to Redis with `SETEX` (`REDIS_TTL_SECONDS`, default 300s), and returned with header `X-Cache: MISS`.
3. Subsequent identical requests return from Redis with `X-Cache: HIT`.
4. Any admin destination create/update/delete or review rating recalculation triggers `redisCache.invalidatePattern('dest:*')`.
5. If Redis is unreachable or throws a socket error, `RedisCacheManager` logs a warning and gracefully falls back to MongoDB without failing the request.

---

## 5. Logging, Security & File Storage

- **Winston + Morgan (`server/config/logger.js`, `server/middleware/httpLogger.js`)**: Structured console & file logs (`error.log`, `combined.log`) with recursive redaction of `password`, `token`, `jwt`, `authorization`, and cloud credentials.
- **File Uploads (`server/middleware/upload.js`, `server/storage/storageAdapter.js`)**: Multer memory storage validates MIME type (`image/jpeg`, `image/png`, `image/webp`) and size (`MAX_FILE_SIZE_MB=2`), then delegates persistence to either `LocalStorageAdapter` (`/uploads/<random>.ext`) or `CloudStorageAdapter` (S3-compatible PUT when `STORAGE_DRIVER=s3` and credentials are configured).
