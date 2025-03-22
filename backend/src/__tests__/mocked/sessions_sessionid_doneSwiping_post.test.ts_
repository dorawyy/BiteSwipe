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

// Interface POST /sessions/:sessionId/doneSwiping
describe('Mocked: POST /sessions/:sessionId/doneSwiping', () => {
  test('Done Swiping - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.userDoneSwiping.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';

    const response = await request(app)
      .post(`/sessions/${sessionId}/doneSwiping`)
      .send({ userId });
    expect(response.status).toBe(500);
  });

  test('Done Swiping - Success', async () => {
    const mockSession = {
      _id: '67bd263553651617ebf5c04f',
      userId: '67bd263553651617ebf5c04f',
      active: true,
      restaurants: [],
      matches: []
    };

    mockSessionManager.userDoneSwiping.mockResolvedValue(mockSession);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';

    const response = await request(app)
      .post(`/sessions/${sessionId}/doneSwiping`)
      .send({ userId });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, session: mockSession._id });
  });
});
