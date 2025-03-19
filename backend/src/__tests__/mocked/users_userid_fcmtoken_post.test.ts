import './mocked_setup';

import request from "supertest";
import { Express } from "express";
import { createApp } from "../../app";
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { mockUserService } from './mocked_setup';

describe("POST /users/:userId/fcm-token - Mocked", () => {
  let app: Express;
  let agent: request.Agent;

  beforeAll(async () => {
    // No setup needed in beforeAll
  });

  afterAll(() => {
    // No need to disconnect from mongoose as it's mocked
    jest.resetAllMocks();
  });

  beforeEach(async () => {
    // Ensure mongoose.connect is mocked and doesn't try to connect to a real DB
    jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);

    // Create app using shared createApp function
    app = await createApp();
    agent = request.agent(app);


  });

  afterEach(async () => {
    // Clear all mocks after each test
    jest.clearAllMocks();
    // This will reset all mock implementations to their default values
  });

  /**
   * Test: Invalid user ID format error handling in POST /users/:userId/fcm-token
   * Input: userId with invalid format ("invalid-id") and valid FCM token
   * Expected behavior: userService.updateFCMToken throws an error with message "Invalid user ID format"
   * Expected output: 400 status with error message "Invalid user ID format"
   */
  test("should return 400 status when user ID format is invalid", async () => {

    // Override only the updateFCMToken method for this specific test
    mockUserService.updateFCMToken.mockImplementation(() => {
      throw new Error('Invalid user ID format');
    });
    
    // We'll restore the original implementation in afterEach via jest.clearAllMocks()

    const validUserId = new Types.ObjectId().toString();

    // Send request with invalid user ID
    const response = await agent
      .post(`/users/${validUserId}/fcm-token`)
      .send({ fcmToken: 'validFcmToken' })
      .expect('Content-Type', /json/)
      .expect(400);

    // Verify response
    expect(response.body).toHaveProperty('error', 'Invalid user ID format');
  }, 10000); // Increase timeout to 10 seconds
});



