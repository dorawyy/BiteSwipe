import './unmocked_setup';

import mongoose from 'mongoose';
import request from 'supertest';
import { Express } from "express";
import { createApp } from '../../app';

describe('POST /sessions - Unmocked', () => {
  let app: Express;
  let agent: request.Agent;
  let server: any;
  const pendingTimeouts: any = [];

// Mock the setTimeout function to track timeouts
    const originalSetTimeout = global.setTimeout;
    const mockedSetTimeout = (fn: any, ms:number) => {
      const timeoutId = originalSetTimeout(fn, ms);
      pendingTimeouts.push(timeoutId);
      return timeoutId;
    };
    mockedSetTimeout.__promisify__ = originalSetTimeout.__promisify__;
    global.setTimeout = mockedSetTimeout as any;

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
    pendingTimeouts.forEach(clearTimeout);
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
    app =  createApp();
    agent = request.agent(app);
    server = app.listen(0);
  });

  afterEach(async () => {
    if(server) {
        await new Promise (resolve => server.close(resolve));
    }
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

    // start the session 

    const startSession = await agent
      .post(`/sessions/${getSessionResponse.body._id}/start`)
      .send({
        userId: creatorResponse.body._id,
        time: 5
      });
    expect(startSession.status).toBe(200);

    // start swiping

    // Invalid id 

    const swiping = await agent
      .post(`/sessions/ABSER12121212/votes`)
      .send({
        userId: creatorResponse.body._id,
        restaurantId: 'restaurant-id',
        liked: true
      });
    // wrong user id 
    expect(swiping.status).toBe(400);

    const swiping2 = await agent
      .post(`/sessions/${getSessionResponse.body._id}/votes`)
      .send({
        userId: 'invalid-user-id',
        restaurantId: 'restaurant-id',
        liked: true
      });
    //console.log(swiping2.body);
    expect(swiping2.status).toBe(500);

    // correct info
    let count = 0;
    for (const restaurant of getSessionResponse.body.restaurants) {
      count++;
      const restId = restaurant.restaurantId;
      const swiped1 = await agent
        .post(`/sessions/${getSessionResponse.body._id}/votes`)
        .send({
          userId: inviteeResponse.body._id,
          restaurantId: restId,
          liked: count === 1 
        });
      expect(swiped1.status).toBe(200);
      const swiped2 = await agent
        .post(`/sessions/${getSessionResponse.body._id}/votes`)
        .send({
          userId: creatorResponse.body._id,
          restaurantId: restId,
          liked: count === 1
        });
      expect(swiped2.status).toBe(200);

      const result = await agent
        .get(`/sessions/${getSessionResponse.body._id}/result`);
      //session not completed error
      expect(result.status).toBe(500);
    }

    //condition where user already swiped the session and trying to swipe again

    const swipe = await agent
      .post(`/sessions/${getSessionResponse.body._id}/votes`)
      .send({
        userId: creatorResponse.body._id,
        restaurantId: getSessionResponse.body.restaurants[0].restaurantId,
        liked: true
      });
    expect(swipe.status).toBe(500);

    const newSession = await agent
      .post('/sessions')
      .send({
        userId: inviteeResponse.body._id,
        latitude: 47.376313,
        longitude: 8.54767,
        radius: 1000
      });
    //swiping in wrong session
    const swipe2 = await agent
      .post(`/sessions/${newSession.body._id}/votes`)
      .send({
        userId: creatorResponse.body._id,
        restaurantId: newSession.body.restaurants[0].restaurantId,
        liked: true
      });
    expect(swipe2.status).toBe(500);

    // get result 
    const result = await agent
      .get(`/sessions/invalid-id-format/result`);
    //session not completed error
    expect(result.status).toBe(400);

    // session not found in result

    const result2 = await agent
      .get(`/sessions/67bfa9a78de8ce6824fb56cd/result`);
    expect(result2.status).toBe(500);
    // sending userDone 

    const userDone1 = await agent
      .post(`/sessions/${getSessionResponse.body._id}/doneSwiping`)
      .send({
        userId: creatorResponse.body._id
      });
    expect(userDone1.status).toBe(200);

    const userDone2 = await agent
      .post(`/sessions/${getSessionResponse.body._id}/doneSwiping`)
      .send({
        userId: inviteeResponse.body._id
      });

    expect(userDone2.status).toBe(200);

    // get result 

    const result3 = await agent
      .get(`/sessions/${getSessionResponse.body._id}/result`);
    expect(result3.status).toBe(200);

    const leaveSession = await agent
      .delete(`/sessions/${getSessionResponse.body._id}/participants/${inviteeResponse.body._id}`);

    expect(leaveSession.status).toBe(500);

  });
});
