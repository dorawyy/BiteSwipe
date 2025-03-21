import "./unmocked_setup";

import mongoose from "mongoose";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../app";
import { UserModel } from "../../models/user";

describe("POST /users/:userId/fcm-token - Unmocked", () => {
  let app: Express;
  let agent: request.Agent;
  let userId: string;

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

    // Create a test user for each test
    const userData = {
      email: "test@example.com",
      displayName: "Test User"
    };

    const createResponse = await agent
      .post("/users")
      .send(userData)
      .expect(201);

    userId = createResponse.body._id;
  });

  /**
   * Test: POST /users/:userId/fcm-token
   * Input: Valid user ID and FCM token
   * Expected behavior: Updates user's FCM token
   * Expected output: Success message with 200 status code
   */
  test("should update FCM token for valid user", async () => {
    const fcmToken = "valid-fcm-token-123";

    const response = await agent
      .post(`/users/${userId}/fcm-token`)
      .send({ fcmToken })
      .expect("Content-Type", /json/)
      .expect(200);
      
    // Verify token was saved
    const updatedUser = await UserModel.findById(userId).lean();
    expect(updatedUser).toHaveProperty("fcmTokens", [fcmToken]);
  });

  /**
   * Test: POST /users/:userId/fcm-token
   * Input: Invalid user ID format
   * Expected behavior: Returns 400 status code
   * Expected output: Error message indicating invalid user ID format
   */
  test("should return 400 for invalid user ID format", async () => {
    // Test with various invalid ObjectId formats
    const invalidIds = [
      'abc',                    // Too short
      '123',                    // Numbers only
      'notahexstring',          // Not hex
      '12345678901234567890ab' // Wrong length
    ];

    for (const invalidId of invalidIds) {
      const response = await agent
        .post(`/users/${invalidId}/fcm-token`)
        .send({ fcmToken: "some-token" })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toEqual({
        error: "Invalid user ID format"
      });
    }
  });

  /**
   * Test: POST /users/:userId/fcm-token
   * Input: FCM token is null
   * Expected behavior: Returns 400 status code
   * Expected output: Validation error message
   */
  test("should return 400 when FCM token is null", async () => {
    // Create a test user first
    const createUserResponse = await agent
      .post('/users')
      .send({
        email: 'test.null.token@example.com',
        displayName: 'Test Null Token User'
      });
    const userId = createUserResponse.body._id;

    const response = await agent
      .post(`/users/${userId}/fcm-token`)
      .send({ fcmToken: null })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      error: 'FCM token is required'
    });
  });

  /**
   * Test: POST /users/:userId/fcm-token
   * Input: Missing FCM token in request body
   * Expected behavior: Returns 400 status code
   * Expected output: Validation error message
   */
  test("should return 400 when FCM token is missing", async () => {
    const response = await agent
      .post(`/users/${userId}/fcm-token`)
      .send({})
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      error: "FCM token is required"
    });
  });

  /**
   * Test: POST /users/:userId/fcm-token
   * Input: Non-existent user ID
   * Expected behavior: Returns 404 status code
   * Expected output: Error message indicating user not found
   */
  test("should return 404 for non-existent user", async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const response = await agent
      .post(`/users/${nonExistentId}/fcm-token`)
      .send({ fcmToken: "some-token" })
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toEqual({
      error: "User not found"
    });
  });

  /**
   * Test: POST /users/:userId/fcm-token
   * Input: Valid user ID when database is disconnected
   * Expected behavior: Returns 500 status code
   * Expected output: Error message indicating internal server error
   */
  test("should return 500 when database error occurs", async () => {
    // First disconnect from database to simulate error
    await mongoose.connection.close();

    const response = await agent
      .post(`/users/${userId}/fcm-token`)
      .send({ fcmToken: "some-token" })
      .expect("Content-Type", /json/)
      .expect(500);

    expect(response.body).toEqual({
      error: "Internal Server Error"
    });

    // Reconnect to database for cleanup
    await mongoose.connect(process.env.DB_URI!);
  });
});