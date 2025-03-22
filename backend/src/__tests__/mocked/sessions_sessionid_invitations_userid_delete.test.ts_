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

// Interface DELETE /sessions/:sessionId/invitations/:userId
describe('Mocked: DELETE /sessions/:sessionId/invitations/:userId', () => {
  test('Reject Invitation - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.rejectInvitation.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/invitations/${userId}`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Reject Invitations - not been invited', async () => {
    const notInvitedError = new Error('not been invited');
    mockSessionManager.rejectInvitation.mockRejectedValue(notInvitedError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/invitations/${userId}`);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'not been invited' });
  });

  test('Reject Invitations - Session not found', async () => {
    const sessionNotFoundError = new Error('Session not found');
    mockSessionManager.rejectInvitation.mockRejectedValue(sessionNotFoundError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/invitations/${userId}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Session not found' });
  });

  test('Reject Invitations - Success', async () => {
    const mockSession = {
      _id: '67bd263553651617ebf5c04f',
      userId: '67bd263553651617ebf5c04f',
      active: true,
      restaurants: [],
      matches: []
    };

    mockSessionManager.rejectInvitation.mockResolvedValue(mockSession);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/invitations/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSession);
  });
});
