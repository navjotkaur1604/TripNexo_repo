# TripNexo REST API Documentation

Base URL (Local / Gateway): `http://localhost:5000/api`  
Authentication header for protected routes: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns monolith health or Gateway aggregated microservice health (`auth`, `destinations`, `trips`, `budget`) |

---

## 2. Authentication & Profile (`/api/auth`)

| Method | Endpoint | Auth | Request Body / Params | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `{ name, email, password, confirmPassword }` | `201 Created` `{ success, token, user }` |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | `200 OK` `{ success, token, user }` |
| `GET` | `/api/auth/me` | Bearer | — | `200 OK` `{ success, user }` (populated `favorites`) |
| `PUT` | `/api/auth/me` | Bearer | `{ name }` | `200 OK` `{ success, user }` |
| `POST` | `/api/auth/profile-image` | Bearer | `multipart/form-data` field `profileImage` (JPG/PNG/WEBP, max 2MB) | `200 OK` `{ success, storageDriver, profileImage, user }` |
| `POST` | `/api/auth/favorites/:destinationId` | Bearer | URL param `destinationId` | `200 OK` `{ success, isFavorite, favorites }` |
| `POST` | `/api/auth/logout` | Public | — | `200 OK` `{ success, message }` |

---

## 3. Destinations (`/api/destinations`)

| Method | Endpoint | Auth | Query / Body | Notes |
|---|---|---|---|---|
| `GET` | `/api/destinations` | Public | `search`, `region`, `state`, `interest`, `bestSeason`, `maxBudget`, `maxDays`, `featured`, `sort`, `page`, `limit` | Redis cached (`X-Cache: HIT/MISS`) |
| `GET` | `/api/destinations/:id` | Public | Mongo `_id` or `slug` (e.g., `jaipur`) | Returns `destination` + 3 `nearbyDestinations` |
| `POST` | `/api/destinations` | Admin | Destination JSON | Invalidates `dest:*` cache |
| `PUT` | `/api/destinations/:id` | Admin | Partial Destination JSON | Invalidates `dest:*` cache |
| `DELETE` | `/api/destinations/:id` | Admin | — | Invalidates `dest:*` cache |

---

## 4. Trips & Dynamic Itineraries (`/api/trips`)

All `/api/trips` endpoints require a valid JWT and enforce trip ownership (`userId === req.user._id` or `admin`).

| Method | Endpoint | Body / Behavior |
|---|---|---|
| `POST` | `/api/trips` | Creates `Trip`, generates `Itinerary` documents in MongoDB, calculates `estimatedCost` |
| `GET` | `/api/trips` | Lists user's trips + MongoDB `aggregate()` stats (`totalTrips`, `upcomingTrips`, `totalEstimatedMin/Max`) |
| `GET` | `/api/trips/:id` | Returns populated trip with ordered `itinerary` days |
| `PUT` | `/api/trips/:id` | Updates trip fields, applies `itineraryUpdates` (`activities`, `notes`), or regenerates if `regenerate: true` |
| `DELETE` | `/api/trips/:id` | Deletes trip and cascades delete to `Itinerary` collection |
| `POST` | `/api/trips/:id/generate-itinerary` | Regenerates day-wise `Itinerary` documents dynamically |
| `POST` | `/api/trips/:id/duplicate` | Clones trip + all `Itinerary` days as `<tripName> (Copy)` |

---

## 5. Budget Calculator (`/api/budget`)

| Method | Endpoint | Auth | Body / Behavior |
|---|---|---|---|
| `POST` | `/api/budget/estimate` | Public | `{ destinationIds, startingCity, travellers, children, duration, accommodationPreference, transportPreference, travelPace, targetBudget, roomsOverride, nightsOverride }` -> returns `estimate` + `tierComparison` |
| `GET` | `/api/budget/trip/:tripId` | Bearer (Owner) | Recalculates & updates `Trip.estimatedCost` in MongoDB |

---

## 6. Reviews (`/api/reviews`)

| Method | Endpoint | Auth | Body / Behavior |
|---|---|---|---|
| `GET` | `/api/reviews/:destinationId` | Public | Returns reviews + MongoDB rating distribution `aggregate()` |
| `POST` | `/api/reviews` | Bearer | `{ destinationId, rating (1-5), comment }` -> recalculates destination averageRating & invalidates Redis cache |
| `PUT` | `/api/reviews/:id` | Bearer (Owner) | Updates rating/comment and recalculates destination average |
| `DELETE` | `/api/reviews/:id` | Bearer (Owner/Admin) | Deletes review and recalculates destination average |

---

## 7. Admin (`/api/admin`)

Requires `Bearer` token with `role: 'admin'`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | MongoDB `aggregate()` counts, trips by status, top popular destinations, Redis status |
| `GET` | `/api/admin/users` | Paginated user list (passwords excluded) |
| `GET` | `/api/admin/trips` | Paginated platform trips with user & destination population |
