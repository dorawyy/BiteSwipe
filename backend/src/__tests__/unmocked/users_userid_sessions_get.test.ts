import './unmocked_setup';

import supertest from 'supertest';
import type { Response } from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { UserModel } from '../../models/user';
import mongoose from 'mongoose';
import { Session } from '../../models/session';

let agent: any;

describe('GET /users/:userId/sessions - Unmocked', () => {
  beforeAll(async () => {
    const app = await createApp();
    agent = supertest(app);
  });

  beforeEach(async () => {
    // Clean up collections before each test
    await UserModel.deleteMany({});
    await Session.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId of a user with no sessions
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response
   * Expected output:
   *   - Response body: { sessions: [] }
   *   - Content-Type: application/json
   */
  test('should return empty array for user with no sessions', async () => {
    // Create a test user
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.sessions@example.com',
        displayName: 'Test Sessions User'
      });
    const userId = createUserResponse.body._id;

    // Get user's sessions
    const response = await agent
      .get(`/users/${userId}/sessions`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({ sessions: [] });
  });

  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Invalid MongoDB ObjectId format
   * Expected behavior:
   *   - Returns 400 status code
   *   - Returns JSON response with error message
   * Expected output:
   *   - Response body: { error: "Unable to fetch sessions" }
   *   - Content-Type: application/json
   */
  test('should return 400 for invalid user ID', async () => {
    const response = await agent
      .get('/users/invalid-mongodb-id/sessions')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({ error: 'Invalid user ID format' });
  });

  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId that doesn't exist in database
   * Expected behavior:
   *   - Returns 400 status code
   *   - Returns JSON response with error message
   * Expected output:
   *   - Response body: { error: "Unable to fetch sessions" }
   *   - Content-Type: application/json
   */
  test('should return 400 for non-existent user ID', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await agent
      .get(`/users/${nonExistentId}/sessions`)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({ error: 'Unable to fetch sessions' });
  });

  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId of a user with active sessions
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response with array of sessions
   * Expected output:
   *   - Response body: { sessions: [{ joinCode, creator, participants, ... }] }
   *   - Content-Type: application/json
   */
  test('should return array of sessions for user with active sessions', async () => {
    // Create a test user
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.sessions.active@example.com',
        displayName: 'Test Sessions Active User'
      });
    const userId = createUserResponse.body._id;

    // Create a session using the API
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(sessionResponse.status).toBe(201);

    // Get user's sessions
    const response = await agent
      .get(`/users/${userId}/sessions`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBe(1);

    // Verify session properties
    const returnedSession = response.body.sessions[0];
    // Verify required properties exist
    expect(returnedSession).toHaveProperty('joinCode');
    expect(returnedSession).toHaveProperty('creator');
    expect(returnedSession).toHaveProperty('status');
    expect(returnedSession).toHaveProperty('settings');
    expect(returnedSession).toHaveProperty('restaurants');

    // Verify data types and values we can be certain about
    expect(typeof returnedSession.joinCode).toBe('string');
    expect(returnedSession.joinCode.length).toBe(5);
    expect(returnedSession.creator).toBe(userId);
    expect(returnedSession.status).toBe('CREATED');

    // Verify location settings match what we sent
    expect(returnedSession.settings.location).toEqual({
      latitude: 49.2827,
      longitude: -123.1207,
      radius: 1000
    });

    // Verify restaurants is an array
    expect(Array.isArray(returnedSession.restaurants)).toBe(true);

    // Verify participants separately since MongoDB adds _id
    expect(returnedSession.participants).toHaveLength(1);
    expect(returnedSession.participants[0]).toMatchObject({
      userId,
      preferences: []
    });
  });

  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId of a user with multiple active sessions
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response with array of multiple sessions
   * Expected output:
   *   - Response body: { sessions: [{ joinCode, creator, participants, ... }, ...] }
   *   - Content-Type: application/json
   */
  test('should return multiple sessions for user with multiple active sessions', async () => {
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.multiple.sessions@example.com',
        displayName: 'Test Multiple Sessions User'
      });
    const userId = createUserResponse.body._id;

    // Create two sessions using the API with a delay between them
    const session1Response = await agent
      .post('/sessions')
      .send({
        userId: userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(session1Response.status).toBe(201);

    // Wait 1 second to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 1000));

    const session2Response = await agent
      .post('/sessions')
      .send({
        userId: userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(session2Response.status).toBe(201);

    const response = await agent
      .get(`/users/${userId}/sessions`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBe(2);
    const joinCodes = response.body.sessions.map((s: any) => s.joinCode);
    expect(joinCodes.length).toBe(2);
    expect(joinCodes[0]).not.toBe(joinCodes[1]);
  });



  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId of a user in a session with multiple participants
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response with session including all participants
   * Expected output:
   *   - Response body: { sessions: [{ joinCode, creator, participants: [...], ... }] }
   *   - Content-Type: application/json
   */
  test('should return session with multiple participants correctly', async () => {
    const [user1Response, user2Response] = await Promise.all([
      agent.post('/users').send({
        email: 'test.multi.user1@example.com',
        displayName: 'Test Multi User 1'
      }),
      agent.post('/users').send({
        email: 'test.multi.user2@example.com',
        displayName: 'Test Multi User 2'
      })
    ]);

    const user1Id = user1Response.body._id;
    const user2Id = user2Response.body._id;

    // Create a session with user1
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: user1Id,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(sessionResponse.status).toBe(201);

    // Invite user2 to the session
    const inviteResponse = await agent
      .post(`/sessions/${sessionResponse.body._id}/invitations`)
      .send({
        email: 'test.multi.user2@example.com'
      });
    expect(inviteResponse.status).toBe(200);

    // User2 joins the session
    const joinResponse = await agent
      .post(`/sessions/${sessionResponse.body.joinCode}/participants`)
      .send({
        userId: user2Id
      });
    expect(joinResponse.status).toBe(200);

    const response = await agent
      .get(`/users/${user1Id}/sessions`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBe(1);

    const session = response.body.sessions[0];
    expect(typeof session.joinCode).toBe('string');
    expect(session.joinCode.length).toBe(5);
    expect(session.participants).toHaveLength(2);
    expect(session.participants.map((p: any) => p.userId.toString())).toEqual(
      expect.arrayContaining([user1Id, user2Id])
    );
  });

  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId of a user with pending session invitations
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response with sessions including pending invitations
   * Expected output:
   *   - Response body: { sessions: [{ joinCode, creator, pendingInvitations: [...], ... }] }
   *   - Content-Type: application/json
   */
  test('should return sessions with pending invitations', async () => {
    const [user1Response, user2Response] = await Promise.all([
      agent.post('/users').send({
        email: 'test.pending.user1@example.com',
        displayName: 'Test Pending User 1'
      }),
      agent.post('/users').send({
        email: 'test.pending.user2@example.com',
        displayName: 'Test Pending User 2'
      })
    ]);

    const user1Id = user1Response.body._id;
    const user2Id = user2Response.body._id;

    // Create a session with user1
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: user1Id,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(sessionResponse.status).toBe(201);

    // Invite user2 to the session
    const inviteResponse = await agent
      .post(`/sessions/${sessionResponse.body._id}/invitations`)
      .send({
        email: 'test.pending.user2@example.com'
      });
    expect(inviteResponse.status).toBe(200);

    // Check user2's sessions (should include the pending invitation)
    const response = await agent
      .get(`/users/${user2Id}/sessions`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBe(1);

    const session = response.body.sessions[0];
    expect(session.pendingInvitations).toContain(user2Id);
  });

  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId of a user who is a participant but not creator
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response with sessions where user is participant
   * Expected output:
   *   - Response body: { sessions: [{ joinCode, creator, participants: [...], ... }] }
   *   - Content-Type: application/json
   */
  test('should return sessions where user is participant but not creator', async () => {
    const [user1Response, user2Response] = await Promise.all([
      agent.post('/users').send({
        email: 'test.participant.user1@example.com',
        displayName: 'Test Participant User 1'
      }),
      agent.post('/users').send({
        email: 'test.participant.user2@example.com',
        displayName: 'Test Participant User 2'
      })
    ]);

    const user1Id = user1Response.body._id;
    const user2Id = user2Response.body._id;

    // Create a session with user1
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: user1Id,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(sessionResponse.status).toBe(201);

    // Invite user2 to the session
    const inviteResponse = await agent
      .post(`/sessions/${sessionResponse.body._id}/invitations`)
      .send({
        email: 'test.participant.user2@example.com'
      });
    expect(inviteResponse.status).toBe(200);

    // User2 joins the session
    const joinResponse = await agent
      .post(`/sessions/${sessionResponse.body.joinCode}/participants`)
      .send({
        userId: user2Id
      });
    expect(joinResponse.status).toBe(200);

    // Check user2's sessions (should include the session they joined)
    const response = await agent
      .get(`/users/${user2Id}/sessions`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBe(1);

    const session = response.body.sessions[0];
    expect(session.creator.toString()).toBe(user1Id);
    expect(session.participants.some((p: any) => p.userId.toString() === user2Id)).toBe(true);
  });

  /**
   * Test: GET /users/:userId/sessions
   * Input:
   *   - userId: Valid MongoDB ObjectId of a user with multiple sessions
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response with sessions sorted by creation time
   * Expected output:
   *   - Response body: { sessions: [{ joinCode, creator, createdAt, ... }, ...] }
   *   - Content-Type: application/json
   */
  test('should return sessions sorted by creation time', async () => {
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.sorting@example.com',
        displayName: 'Test Sorting User'
      });
    const userId = createUserResponse.body._id;

    // Create three sessions with delays between them
    const session1Response = await agent
      .post('/sessions')
      .send({
        userId: userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(session1Response.status).toBe(201);
    const session1Time = new Date();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const session2Response = await agent
      .post('/sessions')
      .send({
        userId: userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(session2Response.status).toBe(201);
    const session2Time = new Date();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const session3Response = await agent
      .post('/sessions')
      .send({
        userId: userId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });
    expect(session3Response.status).toBe(201);
    const session3Time = new Date();

    const response = await agent
      .get(`/users/${userId}/sessions`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBe(3);

    // Verify sessions are sorted by creation time (newest first)
    const sessions = response.body.sessions;
    expect(new Date(sessions[0].createdAt).getTime()).toBeGreaterThan(new Date(sessions[1].createdAt).getTime());
    expect(new Date(sessions[1].createdAt).getTime()).toBeGreaterThan(new Date(sessions[2].createdAt).getTime());
  });
});

