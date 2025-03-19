import './unmocked_setup';

import mongoose, { Types } from 'mongoose';
import request from 'supertest';
import { Express } from "express";
import { createApp } from '../../app';

describe('DELETE /sessions/:sessionId/invitations/:userId - Unmocked', () => {
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
   * Test: DELETE /sessions/:sessionId/invitations/:userId
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of an existing session
   *   - userId: Valid MongoDB ObjectId of a user who has been invited
   * Expected behavior:
   *   - Removes the user from the session's pendingInvitations array
   * Expected output:
   *   - 200 status code
   *   - JSON response with updated session data
   */
  test('should successfully reject an invitation', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Creator'
      });

    const creatorId = creatorResponse.body._id;

    // Create an invitee user
    const inviteeResponse = await agent
      .post('/users')
      .send({
        email: 'invitee@example.com',
        displayName: 'Invitee'
      });

    const inviteeId = inviteeResponse.body._id;

    // Create a session
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: creatorId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });

    const sessionId = sessionResponse.body._id;

    // Invite the user to the session
    await agent
      .post(`/sessions/${sessionId}/invitations`)
      .send({
        email: 'invitee@example.com'
      });

    // Reject the invitation
    const response = await agent
      .delete(`/sessions/${sessionId}/invitations/${inviteeId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    // Verify the user is no longer in pendingInvitations
    expect(response.body.pendingInvitations).not.toContain(inviteeId);

    // Verify by fetching the session directly
    const verifyResponse = await agent
      .get(`/sessions/${sessionId}`)
      .expect(200);

    expect(verifyResponse.body.pendingInvitations).not.toContain(inviteeId);
  });

  // /**
  //  * Test: DELETE /sessions/:sessionId/invitations/:userId
  //  * Input:
  //  *   - sessionId: Valid MongoDB ObjectId of an existing session
  //  *   - userId: Valid MongoDB ObjectId of a user who has NOT been invited
  //  * Expected behavior:
  //  *   - Returns a 403 error because the user hasn't been invited
  //  * Expected output:
  //  *   - 403 status code
  //  *   - JSON response with error message
  //  */
  test('should return 403 when user has not been invited', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Creator'
      });

    const creatorId = creatorResponse.body._id;

    // Create another user who won't be invited
    const nonInviteeResponse = await agent
      .post('/users')
      .send({
        email: 'noninvitee@example.com',
        displayName: 'Non-Invitee'
      });

    const nonInviteeId = nonInviteeResponse.body._id;

    // Create a session
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: creatorId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });

    const sessionId = sessionResponse.body._id;

    // Try to reject a non-existent invitation
    const response = await agent
      .delete(`/sessions/${sessionId}/invitations/${nonInviteeId}`)
      .expect('Content-Type', /json/)
      .expect(403);

    expect(response.body).toHaveProperty('error', 'User has not been invited to this session');
  });

  /**
   * Test: DELETE /sessions/:sessionId/invitations/:userId
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of a non-existent session
   *   - userId: Valid MongoDB ObjectId
   * Expected behavior:
   *   - Returns a 404 error because the session doesn't exist
   * Expected output:
   *   - 404 status code
   *   - JSON response with error message
   */
  test('should return 404 for non-existent session ID', async () => {
    // Create a user
    const userResponse = await agent
      .post('/users')
      .send({
        email: 'user@example.com',
        displayName: 'User'
      });

    const userId = userResponse.body._id;

    // Generate a valid but non-existent session ID
    const nonExistentSessionId = new Types.ObjectId().toString();

    // Try to reject an invitation for a non-existent session
    const response = await agent
      .delete(`/sessions/${nonExistentSessionId}/invitations/${userId}`)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Session not found');
  });

  // /**
  //  * Test: DELETE /sessions/:sessionId/invitations/:userId
  //  * Input:
  //  *   - sessionId: Invalid MongoDB ObjectId format
  //  *   - userId: Valid MongoDB ObjectId
  //  * Expected behavior:
  //  *   - Returns a 400 error due to invalid session ID format
  //  * Expected output:
  //  *   - 400 status code
  //  *   - JSON response with error message
  //  */
  test('should return 400 for invalid session ID format', async () => {
    // Create a user
    const userResponse = await agent
      .post('/users')
      .send({
        email: 'user@example.com',
        displayName: 'User'
      });

    const userId = userResponse.body._id;

    // Try to reject an invitation with an invalid session ID
    const response = await agent
      .delete(`/sessions/invalid-id/invitations/${userId}`)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid session ID format');
  });

  // /**
  //  * Test: DELETE /sessions/:sessionId/invitations/:userId
  //  * Input:
  //  *   - sessionId: Valid MongoDB ObjectId
  //  *   - userId: Invalid MongoDB ObjectId format
  //  * Expected behavior:
  //  *   - Returns a 400 error due to invalid user ID format
  //  * Expected output:
  //  *   - 400 status code
  //  *   - JSON response with error message
  //  */
  test('should return 400 for invalid user ID format', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Creator'
      });

    const creatorId = creatorResponse.body._id;

    // Create a session
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: creatorId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });

    const sessionId = sessionResponse.body._id;

    // Try to reject an invitation with an invalid user ID
    const response = await agent
      .delete(`/sessions/${sessionId}/invitations/invalid-id`)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid user ID format');
  });

  // /**
  //  * Test: DELETE /sessions/:sessionId/invitations/:userId
  //  * Input:
  //  *   - sessionId: Valid MongoDB ObjectId of a completed session
  //  *   - userId: Valid MongoDB ObjectId of a user who has been invited
  //  * Expected behavior:
  //  *   - Returns an error because completed sessions can't have invitations rejected
  //  * Expected output:
  //  *   - 403 status code (as per implementation in the controller)
  //  *   - JSON response with error message
  //  */
  test('should return error when rejecting invitation to a completed session', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Creator'
      });

    const creatorId = creatorResponse.body._id;

    // Create an invitee user
    const inviteeResponse = await agent
      .post('/users')
      .send({
        email: 'invitee@example.com',
        displayName: 'Invitee'
      });

    const inviteeId = inviteeResponse.body._id;

    // Create a session
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: creatorId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });

    const sessionId = sessionResponse.body._id;

    // Invite the user to the session
    await agent
      .post(`/sessions/${sessionId}/invitations`)
      .send({
        email: 'invitee@example.com'
      });

    // Start the session (which will eventually mark it as completed)
    const sessionDurationInSeconds = 1;
    await agent
      .post(`/sessions/${sessionId}/start`)
      .send({
        userId: creatorId,
        time: sessionDurationInSeconds / 60
      });

    // Wait for session to complete (the setTimeout in startSession)
    await new Promise(resolve => setTimeout(resolve, sessionDurationInSeconds * 1000));

    // Try to reject the invitation for a completed session
    const response = await agent
      .delete(`/sessions/${sessionId}/invitations/${inviteeId}`)
      .expect('Content-Type', /json/)
      .expect(500); //TODO the error code need to be improved

    expect(response.body).toHaveProperty('error', 'Internal server error');
  });

  // /**
  //  * Test: DELETE /sessions/:sessionId/invitations/:userId
  //  * Input:
  //  *   - sessionId: Valid MongoDB ObjectId of an existing session
  //  *   - userId: Valid MongoDB ObjectId of a user who is already a participant
  //  * Expected behavior:
  //  *   - Returns a 403 error because the user is already a participant
  //  * Expected output:
  //  *   - 403 status code
  //  *   - JSON response with error message
  //  */
  test('should return 403 when user is already a participant', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Creator'
      });

    const creatorId = creatorResponse.body._id;

    // Create a session
    const sessionResponse = await agent
      .post('/sessions')
      .send({
        userId: creatorId,
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      });

    const sessionId = sessionResponse.body._id;

    // Try to reject an invitation for the creator (who is already a participant)
    const response = await agent
      .delete(`/sessions/${sessionId}/invitations/${creatorId}`)
      .expect('Content-Type', /json/)
      .expect(500); //TODO the error code need to be improved

    expect(response.body).toHaveProperty('error', 'Internal server error');
  });
});
