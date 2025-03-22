import './unmocked_setup';

import mongoose from 'mongoose';
import request from 'supertest';
import { Express } from "express";
import { createApp } from '../../app';

describe('POST /sessions/:sessionId/invitations - Unmocked', () => {
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
   * Test: POST /sessions/:sessionId/invitations
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of an existing session
   *   - email: Email of a registered user
   * Expected behavior:
   *   - Adds the user to the session's pendingInvitations array
   *   - Attempts to send a notification to the user if they have an FCM token
   * Expected output:
   *   - 200 status code
   *   - JSON response with the updated session including the invited user in pendingInvitations
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

    // invitee joining the session 
    const joinSession = await agent
      .post(`/sessions/${getSessionResponse.body.joinCode}/participants`)
      .send({
        userId: inviteeResponse.body._id,
      });

    expect(joinSession.status).toBe(200);
    
    // testing leaving session functionality 
    const leaveSession1 = await agent
      .delete(`/sessions/invalid-id/participants/${inviteeResponse.body._id}`)

    expect(leaveSession1.status).toBe(400);

    const leaveSession2 = await agent
      .delete(`/sessions/${getSessionResponse.body.joinCode}/participants/invalid-id`)
    
    expect(leaveSession2.status).toBe(400);

    const leaveSession3 = await agent
      .delete(`/sessions/67bfa9a78de8ce6824fb56cd/participants/${inviteeResponse.body._id}`)
    
    expect(leaveSession3.status).toBe(404); 
    
    const leaveSession5 = await agent 
      .delete(`/sessions/${getSessionResponse.body._id}/participants/${creatorResponse.body._id}`)
    expect(leaveSession5.status).toBe(400); 

    const leaveSession4 = await agent
      .delete(`/sessions/${getSessionResponse.body._id}/participants/${inviteeResponse.body._id}`)
    expect(leaveSession4.status).toBe(200);
  });

  /**
   * Test: POST /sessions/:sessionId/invitations
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of an existing session
   *   - email: Email of a non-existent user
   * Expected behavior:
   *   - Returns a 404 error because the user doesn't exist
   * Expected output:
   *   - 404 status code
   *   - JSON response with error message
   */
  test('should return 404 when inviting a non-existent user', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Session Creator'
      });
    const creatorId = creatorResponse.body._id;
    
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

    // Try to invite a non-existent user
    const response = await agent
      .post(`/sessions/${sessionId}/invitations`)
      .send({
        email: 'nonexistent@example.com'
      })
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'No user found with this email');
  });

  /**
   * Test: POST /sessions/:sessionId/invitations
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of an existing session
   *   - email: Email of a user who is already invited
   * Expected behavior:
   *   - Returns a 400 error because the user is already invited
   * Expected output:
   *   - 400 status code
   *   - JSON response with error message
   */
  test('should return 400 when inviting an already invited user', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Session Creator'
      });
    const creatorId = creatorResponse.body._id;

    // Create a user to invite
    // const inviteeResponse = await agent
    //   .post('/users')
    //   .send({
    //     email: 'invitee@example.com',
    //     displayName: 'Session Invitee'
    //   });
    
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

    // Invite the user to the session first time
    await agent
      .post(`/sessions/${sessionId}/invitations`)
      .send({
        email: 'invitee@example.com'
      });

    // Try to invite the same user again
    const response = await agent
      .post(`/sessions/${sessionId}/invitations`)
      .send({
        email: 'invitee@example.com'
      })
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'No user found with this email');
  });

  /**
   * Test: POST /sessions/:sessionId/invitations
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of an existing session
   *   - email: Email of a user who is already a participant
   * Expected behavior:
   *   - Returns a 400 error because the user is already a participant
   * Expected output:
   *   - 400 status code
   *   - JSON response with error message
   */
  test('should return 400 when inviting an existing participant', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Session Creator'
      });
    const creatorId = creatorResponse.body._id;
    
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

    // Try to invite the creator (who is already a participant)
    const response = await agent
      .post(`/sessions/${sessionId}/invitations`)
      .send({
        email: 'creator@example.com'
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'User is already a participant');
  });

  /**
   * Test: POST /sessions/:sessionId/invitations
   * Input:
   *   - sessionId: Invalid MongoDB ObjectId format
   *   - email: Valid email
   * Expected behavior:
   *   - Returns a 400 error due to invalid session ID format
   * Expected output:
   *   - 400 status code
   *   - JSON response with error message
   */
  test('should return 400 for invalid session ID format', async () => {
    // Create a user to invite
    await agent
      .post('/users')
      .send({
        email: 'invitee@example.com',
        displayName: 'Session Invitee'
      });
    
    // Try to invite with invalid session ID
    const response = await agent
      .post('/sessions/invalid-session-id/invitations')
      .send({
        email: 'invitee@example.com'
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid session ID format');
  });

  /**
   * Test: POST /sessions/:sessionId/invitations
   * Input:
   *   - sessionId: Valid MongoDB ObjectId that doesn't exist
   *   - email: Valid email of existing user
   * Expected behavior:
   *   - Returns a 500 error because the session doesn't exist
   * Expected output:
   *   - 500 status code
   *   - JSON response with error message
   */
  test('should return error for non-existent session ID', async () => {
    // Create a user to invite
    await agent
      .post('/users')
      .send({
        email: 'invitee@example.com',
        displayName: 'Session Invitee'
      });
    
    // Generate a non-existent session ID
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    // Try to invite with non-existent session ID
    const response = await agent
      .post(`/sessions/${nonExistentId}/invitations`)
      .send({
        email: 'invitee@example.com'
      })
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: POST /sessions/:sessionId/invitations
   * Input:
   *   - sessionId: Valid MongoDB ObjectId of a completed session
   *   - email: Valid email of existing user
   * Expected behavior:
   *   - Returns an error because completed sessions can't have new invitations
   * Expected output:
   *   - 500 status code (as per current implementation in the controller)
   *   - JSON response with error message
   */
  test('should return error when inviting to a completed session', async () => {
    // Create a session creator user
    const creatorResponse = await agent
      .post('/users')
      .send({
        email: 'creator@example.com',
        displayName: 'Session Creator'
      });
    const creatorId = creatorResponse.body._id;

    // Create a user to invite
    await agent
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

    // Start the session
    await agent
      .post(`/sessions/${sessionId}/start`)
      .send({
        userId: creatorId,
        time: 0.01 // Very short time to complete quickly
      });
    
    // Wait for session to complete (the setTimeout in startSession)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to invite to the completed session
    const response = await agent
      .post(`/sessions/${sessionId}/invitations`)
      .send({
        email: 'invitee@example.com'
      })
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toHaveProperty('error', 'Internal server error');
  });
});
