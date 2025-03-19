import './unmocked_setup';
import supertest from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { UserModel } from '../../models/user';
import mongoose from 'mongoose';
import { Session } from '../../models/session';

let agent: any;

describe('GET /sessions/:sessionId - Unmocked', () => {
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
   * Test: GET /sessions/:sessionId
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of an existing session
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response with session details
   * Expected output:
   *   - Response body: Session object with _id, creator, participants, etc.
   *   - Content-Type: application/json
   */
  test('should return session details for valid session ID', async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.session.get@example.com',
        displayName: 'Test Session Get'
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

    // Get session details
    const response = await agent
      .get(`/sessions/${sessionId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('_id', sessionId);
    expect(response.body).toHaveProperty('creator', userId);
    expect(response.body).toHaveProperty('participants');
    expect(response.body.participants).toContainEqual(expect.objectContaining({ userId }));
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('joinCode');
  });

  /**
   * Test: GET /sessions/:sessionId
   * Input:
   *   - sessionId: Invalid MongoDB ObjectId format
   * Expected behavior:
   *   - Returns 400 status code
   *   - Returns JSON response with error message
   * Expected output:
   *   - Response body: { error: "Invalid session ID format" }
   *   - Content-Type: application/json
   */
  test('should return 400 for invalid session ID format', async () => {
    const response = await agent
      .get('/sessions/invalid-session-id')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({ error: 'Invalid session ID format' });
  });

  /**
   * Test: GET /sessions/:sessionId
   * Input:
   *   - sessionId: Valid MongoDB ObjectId that doesn't exist in database
   * Expected behavior:
   *   - Returns 404 status code
   *   - Returns JSON response with error message
   * Expected output:
   *   - Response body: { error: "Session not found" }
   *   - Content-Type: application/json
   */
  test('should return 404 for non-existent session ID', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await agent
      .get(`/sessions/${nonExistentId}`)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toEqual({ error: 'Session not found' });
  });
});
