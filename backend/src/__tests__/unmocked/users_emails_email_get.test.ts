import './unmocked_setup';

import mongoose from "mongoose";
import request from "supertest";
import { Express } from "express";
import { createApp } from '../../app';


describe('GET /users/emails/:email - Unmocked', () => {
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
   * Test: GET /users/emails/:email
   * Input:
   *   - email: Valid email address of an existing user
   * Expected behavior:
   *   - Returns 200 status code
   *   - Returns JSON response with user data
   * Expected output:
   *   - Response body: { _id, email, displayName }
   *   - Content-Type: application/json
   */
  test('should return user data for existing email', async () => {
    // Create a test user
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.lookup@example.com',
        displayName: 'Test Lookup User'
      });
    expect(createUserResponse.status).toBe(201);

    // // Look up the user by email
    const response = await agent
      .get('/users/emails/test.lookup@example.com')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('userId');
  });

  /**
   * Test: GET /users/emails/:email
   * Input:
   *   - email: Non-existent email address
   * Expected behavior:
   *   - Returns 404 status code
   *   - Returns error message
   * Expected output:
   *   - Response body: { error: string }
   *   - Content-Type: application/json
   */
  test('should return 404 for non-existent email', async () => {
    const response = await agent
      .get('/users/emails/nonexistent@example.com')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: GET /users/emails/:email
   * Input:
   *   - email: Invalid email format
   * Expected behavior:
   *   - Returns 400 status code
   *   - Returns validation error
   * Expected output:
   *   - Response body: { errors: [{ msg: string }] }
   *   - Content-Type: application/json
   */
  test('should return 400 for invalid email format', async () => {
    const response = await agent
      .get('/users/emails/invalid-email')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({ error: 'Valid email is required' });
  });
});
