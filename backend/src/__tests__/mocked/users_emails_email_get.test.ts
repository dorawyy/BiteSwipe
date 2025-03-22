import './mocked_setup';

import request from "supertest";
import { Express } from "express";
import { createApp } from "../../app";
import mongoose from 'mongoose';

// ---------------------------------------------------------
// User Service
//
const mockUserService = {
  getUserById: jest.fn(),
  getUserByUsername: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  updateFCMToken: jest.fn()
};

jest.mock("../../services/userService", () => ({
  UserService: jest.fn().mockImplementation(() => mockUserService)
}));


describe("GET /users/emails/:email - Mocked", () => {
  let app: Express;
  let agent: request.Agent;

  beforeAll(() => {
    // No setup needed in beforeAll
  });

  afterAll(() => {
    // No need to disconnect from mongoose as it's mocked
    jest.resetAllMocks();
  });

  beforeEach(() => {
    // Ensure mongoose.connect is mocked and doesn't try to connect to a real DB
    jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as unknown as typeof mongoose);

    // Create app using shared createApp function
    app = createApp();
    agent = request.agent(app);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  /**
   * Test: Internal server error when fetching user by email
   * Input: Valid email format but service throws an error
   * Expected behavior: UserService.getUserByEmail throws an error
   * Expected output: 500 status with error message
   */
  test("should return 500 when service throws an error", async () => {
    // Override the mockUserService.getUserByEmail to throw an error for this test
    mockUserService.getUserByEmail.mockImplementation(() => {
      throw new Error('Random error');
    });

    // Send request with valid email
    const response = await agent
      .get(`/users/emails/test@example.com`)
      .expect('Content-Type', /json/)
      .expect(500);

    // Verify response
    expect(response.body).toHaveProperty('error', 'Internal Server Error');
  });
});
