import './unmocked_setup';

import mongoose from 'mongoose';
import request from 'supertest';
import { Express } from "express";
import { createApp } from '../../app';

describe('POST /sessions/:sessionId/start - Unmocked', () => {
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
    app = await createApp();
    agent = request.agent(app);
  });

  /**
   * Test: POST /sessions/:sessionId/start
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of an existing session
   *   - userId: Valid MongoDB ObjectId of the session creator
   *   - time: Number of minutes the session should last before auto-completing
   * Expected behavior:
   *   - Updates the session status from CREATED to MATCHING
   *   - Only allows the session creator to start the session
   * Expected output:
   *   - 200 status code
   *   - JSON response with success: true and session._id
   */
  test('should start a session when creator requests it', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.session.start@example.com',
        displayName: 'Test Session Start'
      });
    const userId = createUserResponse.body._id;

    // Create a session
    const createSessionResponse = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    const sessionId = createSessionResponse.body._id;

    // Start the session
    const seconds = 2;
    const response = await agent
      .post(`/sessions/${sessionId}/start`)
      .send({
        userId,
        time: seconds / 60
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('session', sessionId);

    // Verify the session status was updated by fetching it via API
    const getSessionResponse = await agent
      .get(`/sessions/${sessionId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(getSessionResponse.body).toHaveProperty('status', 'MATCHING');
  });

  // /**
  //  * Test: POST /sessions/:sessionId/start
  //  * Input:
  //  *   - sessionId: Valid MongoDB ObjectId of an existing session
  //  *   - userId: Valid MongoDB ObjectId of a user who is not the session creator
  //  *   - time: Number of minutes the session should last
  //  * Expected behavior:
  //  *   - Rejects the request because only the creator can start the session
  //  * Expected output:
  //  *   - 500 status code with error message
  //  */
  test('should reject start request from non-creator user', async () => {
    // Create creator user
    const createCreatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Session Creator'
      });
    const creatorId = createCreatorResponse.body._id;

    // Create another user
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'participant@example.com',
        displayName: 'Session Participant'
      });
    const participantId = createUserResponse.body._id;

    // Create a session with the creator
    const createSessionResponse = await agent
      .post('/sessions')
      .send({
        userId: creatorId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    const sessionId = createSessionResponse.body._id;

    // Try to start the session with the non-creator user
    const seconds = 2;
    const response = await agent
      .post(`/sessions/${sessionId}/start`)
      .send({
        userId: participantId,
        time: seconds / 60
      })
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toHaveProperty('error');

    // Verify the session status was not updated by fetching it via API
    const getSessionResponse = await agent
      .get(`/sessions/${sessionId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(getSessionResponse.body).toHaveProperty('status', 'CREATED');
  });

  // /**
  //  * Test: POST /sessions/:sessionId/start
  //  * Input:
  //  *   - sessionId: Invalid MongoDB ObjectId format
  //  *   - userId: Valid MongoDB ObjectId
  //  *   - time: Number of minutes the session should last
  //  * Expected behavior:
  //  *   - Returns 400 status code for invalid session ID format
  //  * Expected output:
  //  *   - Response body: { error: "Invalid session ID format" }
  //  */
  test('should return 400 for invalid session ID format', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.invalid.session@example.com',
        displayName: 'Test Invalid Session'
      });
    const userId = createUserResponse.body._id;

    const seconds = 2;
    const response = await agent
      .post('/sessions/invalid-session-id/start')
      .send({
        userId,
        time: seconds / 60
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({ error: 'Invalid session ID format' });
  });

  // /**
  //  * Test: POST /sessions/:sessionId/start
  //  * Input:
  //  *   - sessionId: Valid MongoDB ObjectId that doesn't exist in database
  //  *   - userId: Valid MongoDB ObjectId
  //  *   - time: Number of minutes the session should last
  //  * Expected behavior:
  //  *   - Returns 500 status code with error message
  //  * Expected output:
  //  *   - Response contains error property
  //  */
  test('should return error for non-existent session ID', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.nonexistent.session@example.com',
        displayName: 'Test Nonexistent Session'
      });
    const userId = createUserResponse.body._id;

    const seconds = 2;
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const response = await agent
      .post(`/sessions/${nonExistentId}/start`)
      .send({
        userId,
        time: seconds / 60
      })
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });

  // /**
  //  * Test: POST /sessions/:sessionId/start
  //  * Input:
  //  *   - sessionId: Valid MongoDB ObjectId of an existing session
  //  *   - userId: Invalid MongoDB ObjectId format
  //  *   - time: Number of minutes the session should last
  //  * Expected behavior:
  //  *   - Returns 400 status code with error message about invalid ID format
  //  * Expected output:
  //  *   - Response body contains error property
  //  */
  test('should return 400 for invalid user ID format', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.invalid.user@example.com',
        displayName: 'Test Invalid User'
      });
    const userId = createUserResponse.body._id;

    // Create a session
    const createSessionResponse = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    const sessionId = createSessionResponse.body._id;

    const seconds = 2;
    const response = await agent
      .post(`/sessions/${sessionId}/start`)
      .send({
        userId: 'invalid-user-id',
        time: seconds / 60
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  // /**
  //  * Test: POST /sessions/:sessionId/start
  //  * Input:
  //  *   - sessionId: Valid MongoDB ObjectId of an existing session that's already started
  //  *   - userId: Valid MongoDB ObjectId of the session creator
  //  *   - time: Number of minutes the session should last
  //  * Expected behavior:
  //  *   - Rejects the request because the session is already in MATCHING state
  //  * Expected output:
  //  *   - 500 status code with error message
  //  */
  test('should reject starting an already started session', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.already.started@example.com',
        displayName: 'Test Already Started'
      });
    const userId = createUserResponse.body._id;

    // Create a session
    const createSessionResponse = await agent
      .post('/sessions')
      .send({
        userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    const sessionId = createSessionResponse.body._id;

    // Start the session first time
    const seconds = 2;
    await agent
      .post(`/sessions/${sessionId}/start`)
      .send({
        userId,
        time: seconds / 60
      });

    // Try to start the session again
    const response = await agent
      .post(`/sessions/${sessionId}/start`)
      .send({
        userId,
        time: seconds / 60
      })
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });
});
