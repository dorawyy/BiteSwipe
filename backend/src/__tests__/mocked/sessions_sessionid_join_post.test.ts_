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

// Interface POST /sessions/:sessionId/join
describe('Mocked: POST /sessions/:sessionId/join', () => {
  test('Joining Session - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.joinSession.mockRejectedValue(mockError);

    const baseSessionId = '67bd263553651617ebf5c04f';
    const joinCode = 'A2314';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).post(`/sessions/${baseSessionId}/participants`).send({ joinCode, userId });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Joining Session - not Invited', async () => {
    const notInvitedError = new Error('User has not been invited to this session');
    mockSessionManager.joinSession.mockRejectedValue(notInvitedError);

    const sessionId = '67bd263553651617ebf5c04f';
    const UserId = '67bd263553651617ebf5c04f';
    const response = await request(app).post(`/sessions/${sessionId}/participants`).send({ userId: UserId });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'User has not been invited to this session' });
  });

  test('Joining Session Success', async () => {
    const mockSession = {
      _id: '67bd263553651617ebf5c04f',
      userId: '67bd263553651617ebf5c04f',
      active: true,
      restaurants: [],
      matches: []
    };

    mockSessionManager.joinSession.mockResolvedValue(mockSession);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).post(`/sessions/${sessionId}/participants`).send({ userId });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSession);
  });
});
