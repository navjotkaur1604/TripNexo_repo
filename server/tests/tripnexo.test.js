const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_tripnexo';

const { createMonolithApp } = require('../monolith/app');
const Destination = require('../models/Destination');
const User = require('../models/User');
const Itinerary = require('../models/Itinerary');
const rajasthanDestinations = require('../data/rajasthanDestinations');
const { redisCache } = require('../config/redis');
const { calculateTripBudget } = require('../services/core/budgetCalculator');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Destination.insertMany(rajasthanDestinations);
  app = createMonolithApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('TripNexo Backend API — CE-1, CE-2 & ETE Suite', () => {
  let userToken;
  let user2Token;
  let adminToken;
  let jaipurId;
  let ranthamboreId;
  let udaipurId;
  let createdTripId;
  let createdReviewId;

  test('1. User registration, validation & password hashing', async () => {
    const mismatchRes = await request(app).post('/api/auth/register').send({
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      password: 'password123',
      confirmPassword: 'differentpassword',
    });
    expect(mismatchRes.status).toBe(400);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('aarav@example.com');
    expect(res.body.user.password).toBeUndefined();
    userToken = res.body.token;

    // Duplicate registration rejected
    const dupRes = await request(app).post('/api/auth/register').send({
      name: 'Aarav Duplicate',
      email: 'aarav@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(dupRes.status).toBe(409);

    // Second user for ownership isolation test
    const user2Res = await request(app).post('/api/auth/register').send({
      name: 'Meera Rathore',
      email: 'meera@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(user2Res.status).toBe(201);
    user2Token = user2Res.body.token;
  });

  test('2. Login, protected route (/api/auth/me), and role authorization', async () => {
    const badLogin = await request(app).post('/api/auth/login').send({
      email: 'aarav@example.com',
      password: 'wrongpassword',
    });
    expect(badLogin.status).toBe(401);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'aarav@example.com',
      password: 'password123',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();

    // Unauthenticated access blocked
    const noAuth = await request(app).get('/api/auth/me');
    expect(noAuth.status).toBe(401);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('aarav@example.com');

    // Non-admin blocked from admin dashboard
    const forbiddenAdmin = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbiddenAdmin.status).toBe(403);

    // Create admin user & verify admin access
    await User.create({
      name: 'Admin User',
      email: 'admin@tripnexo.in',
      password: 'adminpassword123',
      role: 'admin',
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@tripnexo.in',
      password: 'adminpassword123',
    });
    adminToken = adminLogin.body.token;

    const adminDash = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDash.status).toBe(200);
    expect(adminDash.body.metrics.totalDestinations).toBe(20);
  });

  test('3. Destination search, filtering, sorting, pagination & Redis cache hit/miss/invalidation', async () => {
    // Attach in-memory mock Redis client to verify cache miss -> set -> hit -> invalidate
    const store = new Map();
    redisCache.setClient({
      get: async (k) => store.get(k) || null,
      setEx: async (k, _ttl, v) => {
        store.set(k, v);
        return 'OK';
      },
      keys: async (pattern) => {
        const prefix = pattern.replace('*', '');
        return [...store.keys()].filter((k) => k.startsWith(prefix));
      },
      del: async (keys) => {
        keys.forEach((k) => store.delete(k));
        return keys.length;
      },
    });

    const firstRes = await request(app).get('/api/destinations?limit=10&sort=name_asc');
    expect(firstRes.status).toBe(200);
    expect(firstRes.headers['x-cache']).toBe('MISS');
    expect(firstRes.body.total).toBe(20);
    expect(firstRes.body.destinations.length).toBe(10);

    const secondRes = await request(app).get('/api/destinations?limit=10&sort=name_asc');
    expect(secondRes.status).toBe(200);
    expect(secondRes.headers['x-cache']).toBe('HIT');

    // Search & interest filter
    const searchRes = await request(app).get('/api/destinations?search=Jaipur&interest=heritage');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.destinations[0].name).toBe('Jaipur');
    jaipurId = searchRes.body.destinations[0]._id;

    const ranthRes = await request(app).get('/api/destinations/ranthambore');
    expect(ranthRes.status).toBe(200);
    expect(ranthRes.body.destination.name).toBe('Ranthambore');
    expect(ranthRes.body.nearbyDestinations.length).toBe(3);
    ranthamboreId = ranthRes.body.destination._id;

    const udaipurRes = await request(app).get('/api/destinations/udaipur');
    udaipurId = udaipurRes.body.destination._id;

    // Cache invalidation on admin update
    const updateRes = await request(app)
      .put(`/api/destinations/${jaipurId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tagline: 'The Pink City of Palaces, Stepwells & Observatories' });
    expect(updateRes.status).toBe(200);

    const afterInvalidateRes = await request(app).get('/api/destinations?limit=10&sort=name_asc');
    expect(afterInvalidateRes.headers['x-cache']).toBe('MISS');

    // Graceful fallback if Redis throws
    redisCache.setClient({
      get: async () => {
        throw new Error('Redis socket closed');
      },
      setEx: async () => {
        throw new Error('Redis socket closed');
      },
      keys: async () => [],
      del: async () => 0,
    });
    const fallbackRes = await request(app).get('/api/destinations?limit=5');
    expect(fallbackRes.status).toBe(200);
    expect(fallbackRes.body.destinations.length).toBe(5);
    redisCache.setClient(null);
  });

  test('4. Budget Calculator business rules, unit separation, safari sharing & warnings', async () => {
    const jaipur = await Destination.findById(jaipurId).lean();
    const ranthambore = await Destination.findById(ranthamboreId).lean();

    // 4 travellers -> 2 rooms (max 3/room), 1 vehicle (max 4/vehicle), 1 safari jeep (max 6/vehicle)
    const est4 = calculateTripBudget({
      destinations: [jaipur, ranthambore],
      startingCity: 'Delhi',
      travellers: 4,
      children: 0,
      duration: 5,
      accommodationPreference: 'moderate',
      transportPreference: 'private_cab',
      travelPace: 'balanced',
      targetBudget: 20000,
    });

    expect(est4.rooms).toBe(2);
    expect(est4.nights).toBe(4);
    expect(est4.vehicles).toBe(1);
    expect(est4.breakdown.localTransport.unit).toBe('per_vehicle_per_day');
    expect(est4.breakdown.contingency).toBeUndefined();
    expect(est4.total.min).toBe(
      est4.breakdown.accommodation.min +
        est4.breakdown.food.min +
        est4.breakdown.localTransport.min +
        est4.breakdown.intercityTransport.min +
        est4.breakdown.activities.min
    );
    expect(est4.total.max).toBe(
      est4.breakdown.accommodation.max +
        est4.breakdown.food.max +
        est4.breakdown.localTransport.max +
        est4.breakdown.intercityTransport.max +
        est4.breakdown.activities.max
    );
    expect(est4.budgetWarning).toBeTruthy();
    expect(est4.budgetWarning.exceeded).toBe(true);

    // Automatic intercity transport calculation API test (no manual override or contingency)
    const apiRes = await request(app).post('/api/budget/estimate').send({
      destinationIds: [jaipurId, udaipurId],
      startingCity: 'Jaipur',
      travellers: 2,
      duration: 4,
      accommodationPreference: 'economical',
      transportPreference: 'public',
    });
    expect(apiRes.status).toBe(200);
    expect(apiRes.body.estimate.breakdown.intercityTransport.min).toBeGreaterThan(0);
    expect(apiRes.body.estimate.breakdown.intercityTransport.isOverridden).toBeUndefined();
    expect(apiRes.body.estimate.breakdown.contingency).toBeUndefined();
    expect(apiRes.body.estimate.breakdown.localTransport.unit).toBe('per_person_per_day');
    expect(apiRes.body.tierComparison).toHaveLength(3);
  });

  test('5. Trip creation, dynamic itinerary generation, ownership protection, edit, duplicate & delete', async () => {
    const createRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        tripName: 'Royal Heritage & Lakes Circuit',
        startingCity: 'Jaipur',
        destinations: [
          { destinationId: jaipurId, customDays: 2, order: 0 },
          { destinationId: udaipurId, customDays: 2, order: 1 },
        ],
        startDate: '2026-12-10',
        travellers: 2,
        children: 0,
        duration: 4,
        travelPace: 'balanced',
        interests: ['heritage', 'lake'],
        accommodationPreference: 'moderate',
        transportPreference: 'private_cab',
        budget: { targetMax: 60000 },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.trip.itinerary).toHaveLength(4);
    expect(createRes.body.trip.estimatedCost.breakdown.contingency).toBeUndefined();
    expect(createRes.body.trip.estimatedCost.breakdown.intercityTransport.min).toBeGreaterThan(0);
    createdTripId = createRes.body.trip._id;

    // Verify no duplicate attractions within a destination's generated itinerary
    const suggested = createRes.body.trip.itinerary.flatMap((d) => d.suggestedAttractions);
    expect(new Set(suggested).size).toBe(suggested.length);

    // User 2 cannot read or delete User 1's trip
    const forbiddenGet = await request(app)
      .get(`/api/trips/${createdTripId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(forbiddenGet.status).toBe(403);

    const forbiddenDelete = await request(app)
      .delete(`/api/trips/${createdTripId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(forbiddenDelete.status).toBe(403);

    // Update day notes and trip title
    const firstDayId = createRes.body.trip.itinerary[0]._id;
    const updateRes = await request(app)
      .put(`/api/trips/${createdTripId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        tripName: 'Updated Royal Rajasthan',
        itineraryUpdates: [{ _id: firstDayId, notes: 'Book Amber Fort audio guide early' }],
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.trip.tripName).toBe('Updated Royal Rajasthan');
    expect(updateRes.body.trip.itinerary[0].notes).toBe('Book Amber Fort audio guide early');

    // Duplicate trip
    const dupRes = await request(app)
      .post(`/api/trips/${createdTripId}/duplicate`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(dupRes.status).toBe(201);
    expect(dupRes.body.trip.tripName).toBe('Updated Royal Rajasthan (Copy)');
    expect(dupRes.body.trip.itinerary).toHaveLength(4);

    // Delete duplicated trip and confirm Itinerary cascade cleanup
    const dupId = dupRes.body.trip._id;
    const delRes = await request(app)
      .delete(`/api/trips/${dupId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(delRes.status).toBe(200);
    const remainingDays = await Itinerary.find({ tripId: dupId });
    expect(remainingDays).toHaveLength(0);

    // Verify legacy MongoDB documents containing obsolete contingencyPercent/intercityOverride work safely
    await mongoose.connection.collection('trips').updateOne(
      { _id: new mongoose.Types.ObjectId(createdTripId) },
      { $set: { 'budget.contingencyPercent': 15, 'budget.intercityOverride': 999 } }
    );
    const recalcRes = await request(app)
      .get(`/api/budget/trip/${createdTripId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(recalcRes.status).toBe(200);
    expect(recalcRes.body.estimate.breakdown.contingency).toBeUndefined();
    expect(recalcRes.body.estimate.breakdown.intercityTransport.min).toBeGreaterThan(999);
  });

  test('6. Reviews CRUD and MongoDB rating aggregation', async () => {
    const revRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destinationId: jaipurId,
        rating: 5,
        comment: 'Stunning forts, smooth bazaars, and great heritage value!',
      });
    expect(revRes.status).toBe(201);
    createdReviewId = revRes.body.review._id;

    const listRev = await request(app).get(`/api/reviews/${jaipurId}`);
    expect(listRev.status).toBe(200);
    expect(listRev.body.count).toBe(1);

    const updatedDest = await Destination.findById(jaipurId).lean();
    expect(updatedDest.reviewCount).toBe(1);
    expect(updatedDest.averageRating).toBe(5);

    const delRev = await request(app)
      .delete(`/api/reviews/${createdReviewId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(delRev.status).toBe(200);
  });
});
