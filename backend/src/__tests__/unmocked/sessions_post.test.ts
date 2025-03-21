import './unmocked_setup';

import mongoose from 'mongoose';
import request from 'supertest';
import { Express } from "express";
import { createApp } from '../../app';

import { Session } from '../../models/session';

describe('POST /sessions - Unmocked', () => {
  let app: Express;
  let agent: request.Agent;
  beforeAll(async () => {
    jest.setTimeout(60000); // 60 seconds timeout

    // Connect to test database
    try {
      const dbUri = process.env.DB_URI;
      if (!dbUri) {
        throw new Error("Missing environment variable: DB_URI");
      }

      await mongoose.connect(dbUri);
    } catch (error) {
      console.error(`Failed to connect to database: ${String(error)}`);
      throw new Error("Failed to connect to database");
    }
  });


  afterAll(async () => {
    // Clean up database and close connection
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean all collections before each test
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    // Create app using shared createApp function
    app = createApp();
    agent = request.agent(app);
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId
   *   - latitude: Valid latitude value
   *   - longitude: Valid longitude value
   *   - radius: Valid radius in meters
   * Expected behavior:
   *   - Returns 201 status code
   *   - Creates new session with provided data
   * Expected output:
   *   - Response body: Session object with joinCode, creator, status, settings
   *   - Content-Type: application/json
   */
  test('should create new session with valid data', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.session.creator@example.com',
        displayName: 'Test Session Creator'
      });
    const userId = createUserResponse.body._id;

    // Create a session
    const response = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      })
      .expect('Content-Type', /json/)
      .expect(201);

    // Verify session properties
    expect(response.body).toHaveProperty('joinCode');
    expect(response.body).toHaveProperty('creator');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('settings');
    expect(response.body).toHaveProperty('restaurants');

    // Verify specific values
    expect(typeof response.body.joinCode).toBe('string');
    expect(response.body.joinCode.length).toBe(5);
    expect(response.body.creator).toBe(userId);
    expect(response.body.status).toBe('CREATED');
    expect(response.body.settings.location).toEqual({
      latitude: 49.2827,
      longitude: -123.1207,
      radius: 1000
    });
    expect(Array.isArray(response.body.restaurants)).toBe(true);
    expect(response.body.participants).toHaveLength(1);
    expect(response.body.participants[0]).toMatchObject({
      userId,
      preferences: []
    });

    // Verify the session was saved to the database
    const savedSession = await Session.findOne({ creator: userId });
    expect(savedSession).not.toBeNull();
    expect(savedSession?.joinCode).toBe(response.body.joinCode);
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId
   *   - latitude: Valid latitude value as string
   *   - longitude: Valid longitude value as string
   *   - radius: Valid radius in meters as string
   * Expected behavior:
   *   - Returns 201 status code
   *   - Creates new session with provided data converted to numbers
   * Expected output:
   *   - Response body: Session object with joinCode, creator, status, settings
   *   - Content-Type: application/json
   */
  test('should create new session with string coordinates', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.session.string.coords@example.com',
        displayName: 'Test Session String Coords'
      });
    const userId = createUserResponse.body._id;

    // Create a session with string coordinates
    const response = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: '49.2827',
        longitude: '-123.1207',
        radius: '1000'
      })
      .expect('Content-Type', /json/)
      .expect(201);

    // Verify coordinates were converted to numbers
    expect(response.body.settings.location).toEqual({
      latitude: 49.2827,
      longitude: -123.1207,
      radius: 1000
    });

    // Checking Restaurants in the session

    // Invalid session Id 

    const getRestaurantResponse1 = await agent
      .get(`/sessions/invalid-session-id/restaurants`)
      
    expect(getRestaurantResponse1.status).toBe(400);

    const getRestaurantResponse2 = await agent
      .get(`/sessions/67bfa9a78de8ce6824fb56cd/restaurants`);
    
    expect(getRestaurantResponse2.status).toBe(404);

    const getRestaurantResponse3 = await agent 
      .get(`/sessions/${response.body._id}/restaurants`)

    expect(getRestaurantResponse3.status).toBe(200);
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Invalid MongoDB ObjectId
   *   - latitude: Valid latitude value
   *   - longitude: Valid longitude value
   *   - radius: Valid radius in meters
   * Expected behavior:
   *   - Returns 400 status code for invalid input
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for invalid user ID', async () => {
    const response = await agent
      .post('/sessions')
      .send({
        userId: 'invalid-user-id',
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid user ID format');
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid but non-existent MongoDB ObjectId
   *   - latitude: Valid latitude value
   *   - longitude: Valid longitude value
   *   - radius: Valid radius in meters
   * Expected behavior:
   *   - Returns 400 status code for non-existent user
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for non-existent user ID', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await agent
      .post('/sessions')
      .send({
        userId: nonExistentId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('User not found');
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId
   *   - latitude: Invalid latitude value (out of range)
   *   - longitude: Valid longitude value
   *   - radius: Valid radius in meters
   * Expected behavior:
   *   - Returns 400 status code
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for invalid latitude', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.invalid.lat@example.com',
        displayName: 'Test Invalid Latitude'
      });
    const userId = createUserResponse.body._id;

    const response = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 91, // Invalid latitude (>90)
        longitude: -123.1207,
        radius: 1000
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId
   *   - latitude: Valid latitude value
   *   - longitude: Invalid longitude value (out of range)
   *   - radius: Valid radius in meters
   * Expected behavior:
   *   - Returns 400 status code
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for invalid longitude', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.invalid.lng@example.com',
        displayName: 'Test Invalid Longitude'
      });
    const userId = createUserResponse.body._id;

    const response = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 49.2827,
        longitude: -181, // Invalid longitude (<-180)
        radius: 1000
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId
   *   - latitude: Valid latitude value
   *   - longitude: Valid longitude value
   *   - radius: Invalid radius (negative value)
   * Expected behavior:
   *   - Returns 400 status code
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for invalid radius', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.invalid.radius@example.com',
        displayName: 'Test Invalid Radius'
      });
    const userId = createUserResponse.body._id;

    const response = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: -1000 // Invalid negative radius
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId
   *   - latitude: Valid latitude value
   *   - longitude: Valid longitude value
   *   - radius: Invalid radius (zero value)
   * Expected behavior:
   *   - Returns 400 status code
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for zero radius', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.zero.radius@example.com',
        displayName: 'Test Zero Radius'
      });
    const userId = createUserResponse.body._id;

    const response = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 0 // Zero radius
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId
   *   - latitude: NaN
   *   - longitude: Valid longitude value
   *   - radius: Valid radius in meters
   * Expected behavior:
   *   - Returns 400 status code
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for NaN latitude', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.nan.lat@example.com',
        displayName: 'Test NaN Latitude'
      });
    const userId = createUserResponse.body._id;

    const response = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 'not-a-number',
        longitude: -123.1207,
        radius: 1000
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - Missing userId
   *   - Valid location data
   * Expected behavior:
   *   - Returns 400 status code
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for missing userId', async () => {
    const response = await agent
      .post('/sessions')
      .send({
        // userId intentionally omitted
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: POST /sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId
   *   - Missing location data
   * Expected behavior:
   *   - Returns 400 status code
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 400 for missing location data', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.missing.location@example.com',
        displayName: 'Test Missing Location'
      });
    const userId = createUserResponse.body._id;

    const response = await agent
      .post('/sessions')
      .send({
        userId
        // latitude, longitude, radius intentionally omitted
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  // Invalid user ID format 
  test('Invalid user Id format', async () => {
    // Create a test user first
    const userId = 'invalid-user-id';
    const response = await agent
      .post('/sessions')
      .send({
        userId,
        email: 'test.invalid.lat@example.com',
        displayName: 'Test Invalid Latitude'
      });
  
    expect(response.body).toHaveProperty('error');
  });
});
