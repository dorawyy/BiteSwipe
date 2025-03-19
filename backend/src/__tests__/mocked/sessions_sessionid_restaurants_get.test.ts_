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

// Interface GET /sessions/:sessionId/restaurants
describe('Mocked: GET /sessions/:sessionId/restaurants', () => {
  test('Get Restaurants - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.getRestaurantsInSession.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).get(`/sessions/${sessionId}/restaurants`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Get Restaurants - Session Not Found', async () => {
    const sessionNotFoundError = new Error('Session not found');
    (sessionNotFoundError as any).code = 'SESSION_NOT_FOUND';

    // Configure your mock to reject with this error
    mockSessionManager.getRestaurantsInSession.mockRejectedValue(sessionNotFoundError);
    const sessionId = '67bd263553651617ebf5c04f';

    const response = await request(app).get(`/sessions/${sessionId}/restaurants`);
    expect(response.status).toBe(404);
  });

  test('Get Restaurants - Success', async () => {
    const mockRestaurants = [
      {
        id: 'mock-restaurant-id-123',
        name: 'Mock Restaurant',
        location: {
          latitude: 49.2827,
          longitude: -123.1207
        }
      }
    ];

    mockSessionManager.getRestaurantsInSession.mockResolvedValue(mockRestaurants);

    const sessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).get(`/sessions/${sessionId}/restaurants`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockRestaurants);
  });
});
