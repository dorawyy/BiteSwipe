import "./unmocked_setup";

import mongoose from "mongoose";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../app";

describe("GET /users/:userId - Unmocked", () => {
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
   * Test: GET /users/:userId
   * Input: Valid user ID for an existing user
   * Expected behavior: Returns the user's data
   * Expected output: User object containing email and displayName
   */
  test("should return user when valid ID is provided", async () => {
    // Input: Valid user data for creation and subsequent retrieval
    // Expected behavior: Creates user and then retrieves it by ID
    // Expected output: User object with 200 status code

    // First create a user through the API
    const createResponse = await agent
      .post("/users")
      .send({
        email: "test@example.com",
        displayName: "Test User",
      })
      .expect("Content-Type", /json/)
      .expect(201); // 201 Created - standard response for successful resource creation

    // Get the created user's ID
    const userId = createResponse.body._id;

    // Now retrieve the user through the GET endpoint
    const getResponse = await agent
      .get(`/users/${userId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    // Verify response contains expected user data
    expect(getResponse.body).toMatchObject({
      _id: userId, // Should match the ID we used
      email: "test@example.com",
      displayName: "Test User",
      sessionHistory: expect.any(Array),
      restaurantInteractions: expect.any(Array),
    });
  });

  /**
   * Test: GET /users/:userId
   * Input: Valid MongoDB ObjectId that doesn't match any user
   * Expected behavior: Returns 404 status code
   * Expected output: Error message indicating user not found
   */
  test("should return 404 when user does not exist", async () => {
    // Use a valid but non-existent ObjectId
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const response = await agent
      .get(`/users/${nonExistentId}`)
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toEqual({
      error: "User not found",
    });
  });

  /**
   * Test: GET /users/:userId
   * Input: Invalid MongoDB ObjectId format
   * Expected behavior: Returns 400 status code
   * Expected output: Error message indicating invalid ID format
   */
  test("should return 400 when user ID format is invalid", async () => {
    // Use an invalid ObjectId format
    const invalidId = "invalid-object-id-format";

    const response = await agent
      .get(`/users/${invalidId}`)
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      error: "Invalid user ID format",
    });
  });

  /**
   * Test: GET /users/:userId
   * Input: Valid MongoDB ObjectId when database is disconnected
   * Expected behavior: Returns 500 status code
   * Expected output: Error message indicating internal server error
   */
  test("should return 500 when database error occurs", async () => {
    // First disconnect from database to simulate error
    await mongoose.connection.close();

    // Use a valid ObjectId
    const validId = new mongoose.Types.ObjectId().toString();

    const response = await agent
      .get(`/users/${validId}`)
      .expect("Content-Type", /json/)
      .expect(500);

    expect(response.body).toEqual({
      error: "Internal Server Error",
    });

    // Reconnect to database for cleanup
    await mongoose.connect(process.env.DB_URI!);
  });

  /**
   * Test: POST /users
   * Input: Attempt to create user with an email that already exists
   * Expected behavior: Returns 409 status code
   * Expected output: Error message indicating user already exists
   */
  test("should return 409 when creating user with existing email", async () => {
    // First create a user
    const userData = {
      email: "duplicate@example.com",
      displayName: "Duplicate User",
    };

    // Create the first user
    await agent
      .post("/users")
      .send(userData)
      .expect("Content-Type", /json/)
      .expect(201);

    // Try to create another user with the same email
    const response = await agent
      .post("/users")
      .send(userData)
      .expect("Content-Type", /json/)
      .expect(409);

    expect(response.body).toEqual({
      error: "User with this email already exists",
    });
  });
});
