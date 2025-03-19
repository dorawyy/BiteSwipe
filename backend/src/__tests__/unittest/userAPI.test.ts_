import './unittest_setup';

import { Express } from 'express';
import request from 'supertest';

import { createApp } from '../../app';

let app: Express;

beforeAll(async () => {
  app = await createApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * These tests focus on edge cases and error handling that can't be covered by unmocked tests.
 * All mocks are defined in mocked_setup.ts as per project requirements.
 */

describe('Mocked: GET /users/:userId - Error Handling', () => {
  // Input: Request to get a user with an invalid ID format
  // Expected behavior: Returns a 400 error
  // Expected output: Error message about invalid ID format
  test('Get User - Invalid ID Format', async () => {
    const response = await request(app).get('/users/invalid-id');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid user ID format' });
  });

  // Input: Request to get a user that doesn't exist
  // Expected behavior: Returns a 404 error
  // Expected output: Error message that user was not found
  test('Get User - Not Found', async () => {
    const response = await request(app).get('/users/nonexistentId');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });

  // Input: Request to get a user with server error
  // Expected behavior: Returns a 500 error
  // Expected output: Error message about server error
  test('Get User - Server Error', async () => {
    const response = await request(app).get('/users/server-error');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch user' });
  });
});

describe('Mocked: GET /users/emails/:email - Error Handling', () => {
  // Input: Request to get a user by email that doesn't exist
  // Expected behavior: Returns a 404 error
  // Expected output: Error message that user was not found
  test('Get User by Email - Not Found', async () => {
    const response = await request(app).get('/users/emails/notfound@example.com');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });

  // Input: Request to get a user by email with server error
  // Expected behavior: Returns a 500 error
  // Expected output: Error message about server error
  test('Get User by Email - Server Error', async () => {
    const response = await request(app).get('/users/emails/error@example.com');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch user by email' });
  });
});

describe('Mocked: POST /users/:userId/fcm-token - Error Handling', () => {
  // Input: Request to update FCM token with missing token
  // Expected behavior: Returns a 400 error
  // Expected output: Error message about missing token
  test('Update FCM Token - Missing Token', async () => {
    const response = await request(app)
      .post('/users/testUserId/fcm-token')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        msg: 'FCM token is required'
      })
    );
  });

  // Input: Request to update FCM token with server error
  // Expected behavior: Returns a 500 error
  // Expected output: Error message about server error
  test('Update FCM Token - Server Error', async () => {
    const response = await request(app)
      .post('/users/server-error/fcm-token')
      .send({ fcmToken: 'new-token' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to update FCM token' });
  });
});

describe('Mocked: POST /users - Error Handling', () => {
  // Input: Request to create user with validation errors
  // Expected behavior: Returns a 400 error
  // Expected output: Validation error messages
  test('Create User - Validation Errors', async () => {
    const userData = {
      email: 'invalid-email',
      displayName: ''
    };
    const response = await request(app)
      .post('/users')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        msg: 'Valid email is required'
      })
    );
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        msg: 'Display name is required'
      })
    );
  });

  // Input: Request to create user with server error
  // Expected behavior: Returns a 500 error
  // Expected output: Error message about server error
  test('Create User - Server Error', async () => {
    const userData = {
      email: 'error@example.com',
      displayName: 'Error User'
    };
    const response = await request(app)
      .post('/users')
      .send(userData);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to create user' });
  });
});

describe('Mocked: GET /users/:userId/sessions - Error Handling', () => {
  // Input: Request to get sessions with invalid user ID
  // Expected behavior: Returns a 400 error
  // Expected output: Error message about invalid ID format
  test('Get User Sessions - Invalid User ID', async () => {
    const response = await request(app).get('/users/invalid-id/sessions');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid user ID format' });
  });

  // Input: Request to get sessions with server error
  // Expected behavior: Returns a 500 error
  // Expected output: Error message about server error
  test('Get User Sessions - Server Error', async () => {
    const response = await request(app).get('/users/server-error/sessions');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch sessions' });
  });
});