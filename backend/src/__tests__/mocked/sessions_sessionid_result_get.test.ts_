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

// Interface GET /sessions/:sessionId/result
describe('Mocked: GET /sessions/:sessionId/result', () => {
  test('Session Result - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.getResultForSession.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';

    const response = await request(app)
      .get(`/sessions/${sessionId}/result`);
    expect(response.status).toBe(500);
  });

  test('Session Result - Success', async () => {
    const mockResult = {
      _id: '67bd263553651617ebf5c04f',
      name: 'Mock Restaurant',
      location: {
        latitude: 49.2827,
        longitude: -123.1207
      },
      address: '123 Main St',
      phoneNumber: '123-456-7890',
      website: 'https://example.com',
      photos: ['photo1.jpg'],
      priceLevel: 2,
      rating: 4.5
    };

    mockSessionManager.getResultForSession.mockResolvedValue(mockResult);

    const sessionId = '67bd263553651617ebf5c04f';

    const response = await request(app)
      .get(`/sessions/${sessionId}/result`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResult);
  });
});
