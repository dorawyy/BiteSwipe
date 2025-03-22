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

describe('Mocked: DELETE /sessions/:sessionId/participants/:userId', () => {
  test('Leaving Session - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.leaveSession.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Leaving Session - not a participant', async () => {
    const notInvitedError = new Error('not a participant');
    mockSessionManager.leaveSession.mockRejectedValue(notInvitedError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'not a participant' });
  });

  test('Leaving Session - Session not found', async () => {
    const sessionNotFoundError = new Error('Session not found');
    mockSessionManager.leaveSession.mockRejectedValue(sessionNotFoundError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Session not found' });
  });

  test('Leaving Session - Creator leaving', async () => {
    const creatorLeavingError = new Error('creator cannot leave');
    mockSessionManager.leaveSession.mockRejectedValue(creatorLeavingError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'creator cannot leave' });
  });

  test('Leaving Session - Success', async () => {
    const mockSession = {
      _id: '67bd263553651617ebf5c04f',
      userId: '67bd263553651617ebf5c04f',
      active: true,
      restaurants: [],
      matches: []
    };

    mockSessionManager.leaveSession.mockResolvedValue(mockSession);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSession);
  });
});
