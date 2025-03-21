import './unmocked_setup';

import mongoose from 'mongoose';
import request from 'supertest';
import  { Express } from "express";
import { createApp } from '../../app';


describe('POST /sessions - Unmocked', () => {
  let app: Express;
  let agent: request.Agent;
  beforeAll(async () => {
    jest.setTimeout(60000); // 60 seconds timeout

    // Connect to test database
    try {
      await mongoose.connect(process.env.DB_URI!);
    } catch (error) {
      console.error(`Failed to connect to database: ${error}`);
      process.exit(1);
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
  test('should invite a user to a session', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Session Creator'
      });
    const creatorId = creatorResponse.body._id;

    // Create a user to invite
    const inviteeResponse = await agent
      .post('/users')
      .send({
        email: 'invitee@example.com',
        displayName: 'Session Invitee'
      });

    // Create a session
    const createSessionResponse = await agent
      .post('/sessions')
      .send({
        userId: creatorId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    const sessionId = createSessionResponse.body._id;

    // Invite the user to the session
    const response = await agent
      .post(`/sessions/${sessionId}/invitations`)
      .send({
        email: 'invitee@example.com'
      })
      .expect('Content-Type', /json/)
      .expect(200);

    // Verify the user was added to pendingInvitations
    expect(response.body).toHaveProperty('pendingInvitations');
    expect(response.body.pendingInvitations).toHaveLength(1);

    // Fetch the session to double-check
    const getSessionResponse = await agent
      .get(`/sessions/${sessionId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(getSessionResponse.body).toHaveProperty('pendingInvitations');
    expect(getSessionResponse.body.pendingInvitations).toHaveLength(1);

    const joinSession = await agent
      .post(`/sessions/ABSER12121212/participants`)
      .send({
        userId: inviteeResponse.body._id,
      });
    console.log(joinSession.body);

    expect(joinSession.status).toBe(500);

    const joinSession1 = await agent
      .post(`/sessions/${getSessionResponse.body.joinCode}/participants`)
      .send({
        userId: 'invalid-user-id',
      });
    expect(joinSession1.status).toBe(400);

    const joinSession2 = await agent
      .post(`/sessions/${getSessionResponse.body.joinCode}/participants`)
      .send({
        userId: creatorResponse.body._id,
      });

    expect(joinSession2.status).toBe(500);

    const joinSession3 = await agent
      .post(`/sessions/${getSessionResponse.body.joinCode}/participants`)
      .send({
        userId: inviteeResponse.body._id,
      });
    expect(joinSession3.status).toBe(200);

  });
});
