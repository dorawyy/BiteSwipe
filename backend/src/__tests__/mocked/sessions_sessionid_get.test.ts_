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

// Interface GET /sessions/:sessionId
describe('Mocked: GET /sessions/:sessionId', () => {
  test('Get Session - Invalid ID Format', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.getSession.mockRejectedValue(mockError);

    // Using a non-MongoDB ObjectId format will trigger validation error
    const baseSessionId = 'mock-session-id-123';
    const response = await request(app).get(`/sessions/${baseSessionId}`);

    // The controller validates the session ID format before calling the service
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid session ID format' });
    expect(mockSessionManager.getSession).not.toHaveBeenCalled();
  });

  test('Get Session - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.getSession.mockRejectedValue(mockError);

    // Using a valid MongoDB ObjectId format will pass validation
    const baseSessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).get(`/sessions/${baseSessionId}`);

    // Now the service is called and returns an error
    expect(mockSessionManager.getSession).toHaveBeenCalledWith(baseSessionId);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Get Session - Session Not Found', async () => {
    // Mock the session manager to throw a specific error with a code
    const notFoundError = new Error('Session not found');
    (notFoundError as any).code = 'SESSION_NOT_FOUND';
    mockSessionManager.getSession.mockRejectedValue(notFoundError);

    const baseSessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).get(`/sessions/${baseSessionId}`);

    // Verify the service was called and the controller handled the error correctly
    expect(mockSessionManager.getSession).toHaveBeenCalledWith(baseSessionId);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Session not found' });
  });

  test('Get Session - Session Found', async () => {
    mockSessionManager.getSession.mockImplementation((sessionId) => {
      if (!sessionId) {
        throw new Error('Invalid input');
      }

      return Promise.resolve({
        _id: 'mock-session-id-123',
        userId: '67bd263553651617ebf5c04f',
        active: true,
        restaurants: [],
        matches: []
      });
    });

    const baseSessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).get(`/sessions/${baseSessionId}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: 'mock-session-id-123',
      userId: '67bd263553651617ebf5c04f',
      active: true,
      restaurants: [],
      matches: []
    });
  });
});
