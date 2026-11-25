# TripNexo — College Evaluation & Viva Guide (CE-1 + CE-2 + ETE)

This guide maps every syllabus concept to exact files in the TripNexo codebase and provides a step-by-step live demonstration script for evaluators.

---

## 1. CE-1 Syllabus Coverage

| Concept | Implementation in TripNexo | Key File Paths |
|---|---|---|
| ES6+, Promises, Async/Await, Fetch | Async controllers, `Promise.all`, native `fetch` in Gateway `/api/health` & Cloud adapter | `server/gateway/server.js`, `server/services/destinations/controller.js` |
| Node.js Modules, FS, Path, Buffers, Streams | CommonJS (`server/`), ES Modules (`client/`), `fs.promises` & `Buffer` in storage adapter, log file streams | `server/storage/storageAdapter.js`, `server/config/logger.js` |
| Express Routing, Params, Query, Middleware | Modular routers, `:id` params, filter query params, JWT/validation/error middleware | `server/services/*/routes.js`, `server/middleware/*` |
| REST API, CRUD, Status Codes, Validation | `express-validator` checks + consistent `200/201/400/401/403/404/409/503` responses | `server/middleware/validate.js`, `server/middleware/errorHandler.js` |
| Password Hashing, JWT, Multer | `bcryptjs` pre-save hook, `jsonwebtoken`, Multer memory upload | `server/models/User.js`, `server/middleware/auth.js`, `server/middleware/upload.js` |

---

## 2. CE-2 Syllabus Coverage (Highest Priority)

### A. MongoDB & Mongoose (`server/models/`, `server/services/`, `server/controllers/`)
- **Models & Schemas**:
  - `User` (`server/models/User.js`) — unique `email` index, `favorites` refs, password excluded via `select: false` & `toJSON`.
  - `Destination` (`server/models/Destination.js`) — embedded `attractions`, compound indexes `{ state, region, bestSeason }`, `{ recommendedDays, 'accommodation.moderate.min' }`, text index.
  - `Trip` (`server/models/Trip.js`) — refs to `User`, `Destination`, and `Itinerary`; compound index `{ userId: 1, createdAt: -1 }`.
  - `Itinerary` (`server/models/Itinerary.js`) — refs to `Trip` & `Destination`; unique compound index `{ tripId: 1, dayNumber: 1 }`.
  - `Review` (`server/models/Review.js`) — refs to `User` & `Destination`; unique compound index `{ userId: 1, destinationId: 1 }`.
- **Mongoose Operations Demonstrated**:
  - `find()`, `findOne()`, `findById()`, `create()`, `insertMany()`, `findByIdAndUpdate()`, `findByIdAndDelete()`, `deleteMany()`, `populate()`, `aggregate()` (used in destination filter metadata, user trip stats, review rating averages, and admin dashboard).

### B. React Fundamentals (`client/src/`)
- **Hooks**: `useState`, `useEffect`, `useContext`, `useReducer` (`TripBuilderContext.jsx`), custom hooks (`useDebounce.js`, `useFetch.js`).
- **Context API**: `AuthContext.jsx`, `TripBuilderContext.jsx`, `ToastContext.jsx`.
- **React Router v6 (`client/src/App.jsx`)**: `/`, `/explore`, `/destination/:id`, `/planner`, `/budget`, `/map`, `/my-trips`, `/my-trips/:id`, `/login`, `/register`, `/profile`, `/admin`, `/about`, with `ProtectedRoute.jsx`.
- **Reusable Components**: `Navbar`, `Footer`, `DestinationCard`, `DestinationGrid`, `SearchBar`, `FilterPanel`, `TripForm`, `ItineraryCard`, `DaySchedule`, `BudgetSummary`, `BudgetChart`, `MapView`, `ProtectedRoute`, `LoadingSpinner`, `ErrorMessage`, `EmptyState`, `ConfirmationModal`.

---

## 3. ETE Syllabus Coverage (Advanced Backend)

- **Microservices**: `server/services/auth/server.js`, `destinations/server.js`, `trips/server.js`, `budget/server.js`.
- **API Gateway & Service Discovery**: `server/gateway/server.js` using `http-proxy-middleware` and env-based service URLs (`AUTH_SERVICE_URL`, etc.) + `/api/health` aggregation.
- **Redis Caching**: `server/config/redis.js` + `server/services/destinations/controller.js` (`X-Cache: MISS/HIT`, TTL, pattern invalidation on update/delete/review, graceful fallback).
- **Logging**: `server/config/logger.js` (Winston + secret redaction) & `server/middleware/httpLogger.js` (Morgan).
- **Multer & Cloud Storage Abstraction**: `server/middleware/upload.js` + `server/storage/storageAdapter.js`.
- **Docker & CI/CD**: `docker/Dockerfile.server`, `docker/Dockerfile.client`, `docker/nginx.conf`, `docker-compose.yml`, `.github/workflows/ci.yml`.

---

## 4. Recommended Live Demo Sequence for Evaluators

1. **Automated Tests**: Run `npm --prefix server test` and `npm --prefix client test` to demonstrate passing Jest/Supertest and Vitest/RTL suites.
2. **Home & Explore (`/`, `/explore`)**: Search `"Jaipur"`, filter by interest `wildlife` or `lake`, sort by budget, and inspect Network tab for `X-Cache: MISS` then `X-Cache: HIT` (when Redis is running).
3. **Destination Details (`/destination/jaipur`)**: Show attractions, indicative cost breakdown, nearby hubs, and click **Add to Trip**.
4. **Auth & Profile (`/register`, `/profile`)**: Register a user, confirm JWT login, upload a profile photo via Multer.
5. **Smart Trip Planner (`/planner`)**: Add Jaipur + Udaipur, set 2 adults, Balanced pace, Moderate stay, click **Generate & Save Trip**. Edit a day's notes/activities and save.
6. **Budget Calculator (`/budget`)**: Show room assumption (`ceil(headcount/3)`), transport unit separation (`public` vs `private_cab`), shared safari jeep capacity (select Ranthambore), budget warning, and Recharts chart.
7. **Interactive Map (`/map`)**: Show Rajasthan markers, attraction pins, and route polyline.
8. **My Trips & PDF (`/my-trips`, `/my-trips/:id`)**: Duplicate a trip, delete the copy, restart backend to prove MongoDB persistence, and download the PDF itinerary.
9. **Microservices Gateway**: Run `npm run dev:microservices` and inspect `GET http://localhost:5000/api/health`.
