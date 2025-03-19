import { Express } from 'express';
import request from 'supertest';

import { createApp } from '../../app';

// MUST KEEP. We need to undo the mock from the setup since we are testing the unmocked version
jest.unmock('../../models/user');
let app: Express;

beforeAll(async () => {
  app = await createApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Unmocked: GET /users/:userId', () => {
  test('Get Existing User', async () => {
    const userId = 'testUserId';
    const response = await request(app).get(`/users/${userId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: expect.any(String),
      email: 'test@example.com',
      displayName: 'Test User'
    });
  });

  test('Get User - Invalid ID Format', async () => {
    const response = await request(app).get('/users/invalid-id');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid user ID format' });
  });

  test('Get User - Not Found', async () => {
    const response = await request(app).get('/users/nonexistentId');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });
});

describe('Unmocked: GET /users/emails/:email', () => {
  test('Get User by Email - Found', async () => {
    const response = await request(app).get('/users/emails/exists@example.com');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      userId: 'existingId',
      email: 'exists@example.com',
      displayName: 'Existing User'
    });
  });

  test('Get User by Email - Not Found', async () => {
    const response = await request(app).get('/users/emails/notfound@example.com');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });
});

describe('Unmocked: POST /users/:userId/fcm-token', () => {
  test('Update FCM Token - Success', async () => {
    const response = await request(app)
      .post('/users/testUserId/fcm-token')
      .send({ fcmToken: 'new-token' });
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  test('Update FCM Token - User Not Found', async () => {
    const response = await request(app)
      .post('/users/nonexistentId/fcm-token')
      .send({ fcmToken: 'new-token' });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Unable to update FCM token' });
  });

  test('Update FCM Token - Invalid User ID', async () => {
    const response = await request(app)
      .post('/users/invalid-id/fcm-token')
      .send({ fcmToken: 'new-token' });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Unable to update FCM token' });
  });
});

describe('Unmocked: POST /users', () => {
  test('Create New User', async () => {
    const userData = {
      email: 'test@example.com',
      displayName: 'Test User'
    };
    const response = await request(app)
      .post('/users')
      .send(userData);
    
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      _id: 'newUserId',
      email: userData.email,
      displayName: userData.displayName,
      sessionHistory: [],
      restaurantInteractions: []
    });
  });

  test('Create User - Invalid Email', async () => {
    const userData = {
      email: 'invalid-email',
      displayName: 'Test User'
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
  });

  test('Create User - Already Exists', async () => {
    const userData = {
      email: 'exists@example.com',
      displayName: 'Test User'
    };
    const response = await request(app)
      .post('/users')
      .send(userData);
    
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'User with this email already exists' });
  });

  test('Create User - Missing Fields', async () => {
    const response = await request(app)
      .post('/users')
      .send({});
    
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
});

describe('Unmocked: GET /users/:userId/sessions', () => {
  test('Get User Sessions - Success', async () => {
    const response = await request(app).get('/users/testUserId/sessions');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sessions: [
        {
          _id: 'session1',
          name: 'Test Session 1'
        },
        {
          _id: 'session2',
          name: 'Test Session 2'
        }
      ]
    });
  });

  test('Get User Sessions - Invalid User ID', async () => {
    const response = await request(app).get('/users/invalid-id/sessions');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Unable to fetch sessions' });
  });

  test('Get User Sessions - User Not Found', async () => {
    const response = await request(app).get('/users/nonexistentId/sessions');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Unable to fetch sessions' });
  });
});