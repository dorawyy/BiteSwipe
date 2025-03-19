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

// Interface POST /sessions/:sessionId/start
describe('Mocked: POST /sessions/:sessionId/start', () => {
  test('Start Session - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.startSession.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const time = 1000;
    const response = await request(app)
      .post(`/sessions/${sessionId}/start`)
      .send({ userId, time });
    expect(response.status).toBe(500);
  });

  test('Start Session - Success', async () => {
    const mockSession = {
      _id: '67bd263553651617ebf5c04f',
      userId: '67bd263553651617ebf5c04f',
      active: true,
      restaurants: [],
      matches: []
    };

    mockSessionManager.startSession.mockResolvedValue(mockSession);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const time = 1000;
    const response = await request(app)
      .post(`/sessions/${sessionId}/start`)
      .send({ userId, time });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, session: mockSession._id });
  });
});
