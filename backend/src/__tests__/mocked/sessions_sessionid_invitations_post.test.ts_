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

describe('Mocked: POST /sessions/:sessionId/invitations', () => {
  // Import mockUserService from mocked_setup
  const { mockUserService } = require('./mocked_setup');

  test('Invite User - Missing Username', async () => {
    // Test case: Username is required but not provided
    const sessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).post(`/sessions/${sessionId}/invitations`);

    // Expect a 400 Bad Request response
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Username is required' });
  });

  test('Invite User - User Not Found', async () => {
    // Create a specific error with a code to indicate user not found
    const mockError = new Error('User not found');
    (mockError as any).code = 'USER_NOT_FOUND';
    mockUserService.getUserByUsername.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const username = 'nonexistentuser';
    const response = await request(app)
      .post(`/sessions/${sessionId}/invitations`)
      .send({ username });

    // Verify the user service was called with the correct username
    expect(mockUserService.getUserByUsername).toHaveBeenCalledWith(username);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });

  test('Invite User - Session Not Found', async () => {
    // Mock successful user lookup
    const mockUser = { _id: 'mockUserId', username: 'testuser' };
    mockUserService.getUserByUsername.mockResolvedValue(mockUser);

    // Create a specific error with a code to indicate session not found
    const mockError = new Error('Session not found');
    (mockError as any).code = 'SESSION_NOT_FOUND';
    mockSessionManager.addPendingInvitation.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const username = 'testuser';
    const response = await request(app)
      .post(`/sessions/${sessionId}/invitations`)
      .send({ username });

    // Verify both service calls were made with the correct parameters
    expect(mockUserService.getUserByUsername).toHaveBeenCalledWith(username);
    expect(mockSessionManager.addPendingInvitation).toHaveBeenCalledWith(sessionId, mockUser._id);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Session not found' });
  });

  test('Invite User - Service Error', async () => {
    // Mock successful user lookup
    const mockUser = { _id: 'mockUserId', username: 'testuser' };
    mockUserService.getUserByUsername.mockResolvedValue(mockUser);

    // Generic service error without a specific code
    const mockError = new Error('Service failure');
    mockSessionManager.addPendingInvitation.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const username = 'testuser';
    const response = await request(app)
      .post(`/sessions/${sessionId}/invitations`)
      .send({ username });

    // Verify both service calls were made with the correct parameters
    expect(mockUserService.getUserByUsername).toHaveBeenCalledWith(username);
    expect(mockSessionManager.addPendingInvitation).toHaveBeenCalledWith(sessionId, mockUser._id);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Invite User - Success', async () => {
    // Mock successful user lookup
    const mockUser = { _id: 'mockUserId', username: 'testuser' };
    mockUserService.getUserByUsername.mockResolvedValue(mockUser);

    // Mock successful invitation
    mockSessionManager.addPendingInvitation.mockResolvedValue(true);

    const sessionId = '67bd263553651617ebf5c04f';
    const username = 'testuser';
    const response = await request(app)
      .post(`/sessions/${sessionId}/invitations`)
      .send({ username });

    // Verify both service calls were made with the correct parameters
    expect(mockUserService.getUserByUsername).toHaveBeenCalledWith(username);
    expect(mockSessionManager.addPendingInvitation).toHaveBeenCalledWith(sessionId, mockUser._id);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Invitation sent successfully' });
  });
});
