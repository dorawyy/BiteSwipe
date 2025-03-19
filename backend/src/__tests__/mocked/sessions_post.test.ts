import './mocked_setup';

import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../app';
import { mockSessionManager } from './mocked_setup';

let app: Express;

beforeAll(async () => {
  app = await createApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Interface POST /sessions
describe('Mocked: POST /sessions', () => {
  // Mocked behavior: SessionManager.createSession throws error
  // Input: valid session data
  // Expected status code: 500
  // Expected behavior: returns error message
  // Expected output: { error: 'Internal Server Error' }
  test('Create Session - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.createSession.mockRejectedValue(mockError);

    const sessionData = {
      userId: 'testUserId',
      latitude: 49.2827,
      longitude: -123.1207,
      radius: 1000
    };
    const response = await request(app)
      .post('/sessions')
      .send(sessionData);

    // The service error is propagated to the controller
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });

    // Verify the service was called with the correct parameters
    expect(mockSessionManager.createSession).toHaveBeenCalledWith(
      'testUserId', 
      expect.objectContaining({
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 1000
      })
    );
  });

  test('Create Session - User Id', async () => {
    mockSessionManager.createSession.mockImplementation((userId, location) => {
      if (!userId || !location) {
        throw new Error('Invalid input');
      }

      if (location.latitude === undefined || location.longitude === undefined
        || location.radius === undefined) {
        throw new Error('Invalid location');
      }

      return Promise.resolve({
        _id: 'mock-session-id-123',
        userId: userId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: location.radius
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        restaurants: [],
        matches: []
      });
    });

    const sessionData = {
      userId: '67bd263553651617ebf5c04f',
      latitude: 49.2827,
      longitude: -123.1207,
      radius: 1000
    };
    const response = await request(app)
      .post('/sessions')
      .send(sessionData);
    expect(response.status).toBe(201);
  });
});
