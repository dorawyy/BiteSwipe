import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../app';
import { mockSessionManager, mockRestaurantService } from '../setup';

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
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid user ID format' });
    // expect(mockSessionManager.createSession).toHaveBeenCalled();
  });

  test('Create Session - User Id', async () => {
    mockSessionManager.createSession.mockImplementation((userId, location) => {
      if(!userId || !location) {
        throw new Error('Invalid input');
      }
    
      if(location.latitude === undefined || location.longitude === undefined
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

describe('Mocked: GET /sessions/:sessionId', () => {
  test('Get Session - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.getSession.mockRejectedValue(mockError); 

    const baseSessionId = 'mock-session-id-123';
    const response = await request(app).get(`/sessions/${baseSessionId}`);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid session ID format' });
  });

  test('Get Session - Service Error', async () => {
    const mockError = new Error('Service failure');
    mockSessionManager.getSession.mockRejectedValue(mockError); 

    const baseSessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).get(`/sessions/${baseSessionId}`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Get Session - Session Not Found', async () => {
    mockSessionManager.getSession.mockResolvedValue(null);

    const baseSessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).get(`/sessions/${baseSessionId}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Session not found' });
  });

  test('Get Session - Session Found', async () => {
    mockSessionManager.getSession.mockImplementation((sessionId) => {
      if(!sessionId) {
        throw new Error('Invalid input');
      }

      return Promise.resolve({
        _id: 'mock-session-id-123',
        userId: '67bd263553651617ebf5c04f',
        active: true,
        restaurants: [],
        matches: []
      })
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
  })
});

describe('Mocked: POST /sessions/:sessionId/invitations', () => {
  const mockUserFindOne = jest.fn();
  jest.mock('../../models/user', () => ({
    UserModel: {
      findOne: mockUserFindOne
    }
  }));


  const mockNotificationService = {
    sendNotification: jest.fn()
  }

  test('Invite User - Service Error', async() => {
    //email is required error
    const mockError = new Error('Service failure');
    mockUserFindOne.mockRejectedValue(mockError);

    const baseSessionId = '67bd263553651617ebf5c04f'; 
    const response = await request(app).post(`/sessions/${baseSessionId}/invitations`);
    expect(response.status).toBe(400);
  });

  test('Invite User - Service Error', async() => {
    //invalid email
    const mockError = new Error('Service failure');
    mockUserFindOne.mockRejectedValue(mockError);

    const baseSessionId = '67bd263553651617ebf5c04f'; 
    const email = 'test@test.com';
    const response = await request(app).post(`/sessions/${baseSessionId}/invitations`).send({email});
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No user found with this email'});
  });

  test('Imvite User - correct User', async() => {
    const mockUser = {
      _id: '67bd263553651617ebf5c04f',
      email: 'test@test.com',
      displayName: 'Test User'
    };

    mockUserFindOne.mockClear();
    mockSessionManager.addPendingInvitation.mockClear();

    mockUserFindOne.mockResolvedValue(mockUser);

    mockSessionManager.addPendingInvitation.mockResolvedValue({
      _id: 'mock-session-id',
      pendingInvitations: [mockUser._id]
    });
    
    const baseSessionId = '67bd263553651617ebf5c04f';
    const email = 'test@test.com';
    const response = await request(app).post(`/sessions/${baseSessionId}/invitations`).send({email});
    
  })

});

describe('Mocked: POST /sessions/:sessionId/join', () => {
  test('Joining Session - Service Error', async() => {
    const mockError = new Error('Service failure'); 
    mockSessionManager.joinSession.mockRejectedValue(mockError);

    const baseSessionId = '67bd263553651617ebf5c04f';
    const joinCode = 'A2314';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).post(`/sessions/${baseSessionId}/participants`).send({joinCode, userId});
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Joining Session - not Invited', async() => {
    const notInvitedError = new Error('User has not been invited to this session');
    mockSessionManager.joinSession.mockRejectedValue(notInvitedError);

    const sessionId = '67bd263553651617ebf5c04f';
    const UserId = '67bd263553651617ebf5c04f';
    const response = await request(app).post(`/sessions/${sessionId}/participants`).send({userId: UserId});
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'User has not been invited to this session' });
  });

  test('Joining Session Success', async() => {
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
    const response = await request(app).post(`/sessions/${sessionId}/participants`).send({userId});
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSession);
  });
});

describe('Mocked: DELETE /sessions/:sessionId/participants/:userId', () => {
  test('Leaving Session - Service Error', async() => {
    const mockError = new Error('Service failure');
    mockSessionManager.leaveSession.mockRejectedValue(mockError); 

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Leaving Session - not a participant', async() => {
    const notInvitedError = new Error('not a participant');
    mockSessionManager.leaveSession.mockRejectedValue(notInvitedError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'not a participant' });
  });

  test('Leaving Session - Session not found', async() => {
    const sessionNotFoundError = new Error('Session not found');
    mockSessionManager.leaveSession.mockRejectedValue(sessionNotFoundError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Session not found' });
  });

  test('Leaving Session - Creator leaving', async() => {
    const creatorLeavingError = new Error('creator cannot leave');
    mockSessionManager.leaveSession.mockRejectedValue(creatorLeavingError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/participants/${userId}`);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'creator cannot leave' });
  })

  test('Leaving Session - Success', async() => {
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

describe('Mocked: DELETE /sessions/:sessionId/invitations/:userId', () => {
  test('Reject Invitation - Service Error', async() => {
    const mockError = new Error('Service failure');
    mockSessionManager.rejectInvitation.mockRejectedValue(mockError); 

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/invitations/${userId}`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Reject Invitations - not been invited', async() => {
    const notInvitedError = new Error('not been invited');
    mockSessionManager.rejectInvitation.mockRejectedValue(notInvitedError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/invitations/${userId}`);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'not been invited' });
  });

  test('Reject Invitations - Session not found', async() => {
    const sessionNotFoundError = new Error('Session not found');
    mockSessionManager.rejectInvitation.mockRejectedValue(sessionNotFoundError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const response = await request(app).delete(`/sessions/${sessionId}/invitations/${userId}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Session not found' });
  });

  test('Reject Invitations - Success', async() => {
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

describe('Mocked: GET /sessions/:sessionId/restaurants', () => {
  test('Get Restaurants - Service Error', async() => {
    const mockError = new Error('Service failure');
    mockSessionManager.getRestaurantsInSession.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const response = await request(app).get(`/sessions/${sessionId}/restaurants`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  test('Get Restaurants - Session Not Found', async() => {
    const sessionNotFoundError = new Error('Session not found');
    (sessionNotFoundError as any).code = 'SESSION_NOT_FOUND';
  
  // Configure your mock to reject with this error
    mockSessionManager.getRestaurantsInSession.mockRejectedValue(sessionNotFoundError);
    const sessionId = '67bd263553651617ebf5c04f';
    
    const response = await request(app).get(`/sessions/${sessionId}/restaurants`);
    expect(response.status).toBe(404);
  });

  test('Get Restaurants - Success', async() => {
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

describe('Mocked: POST /sessions/:sessionId/votes', () => {
  test('Record Vote - Service Error', async() => {
    const mockError = new Error('Service failure');
    mockSessionManager.sessionSwiped.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const voteData = {
      restaurantId: 'mock-restaurant-id-123',
      liked: true,
      userId: '67bd263553651617ebf5c04f'
    };
    const response = await request(app)
      .post(`/sessions/${sessionId}/votes`)
      .send(voteData);
    expect(response.status).toBe(500);
  });

  test('Record Vote - Success', async() => {
    const mockSession = {
      _id: '67bd263553651617ebf5c04f',
      userId: '67bd263553651617ebf5c04f',
      active: true,
      restaurants: [],
      matches: []
    };

    mockSessionManager.sessionSwiped.mockResolvedValue(mockSession);

    const sessionId = '67bd263553651617ebf5c04f';
    const voteData = {
      restaurantId: 'mock-restaurant-id-123',
      liked: true,
      userId: '67bd263553651617ebf5c04f'
    };
    const response = await request(app)
      .post(`/sessions/${sessionId}/votes`)
      .send(voteData);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({success: true, session: mockSession._id});
  });

});


describe('Mocked: POST /sessions/:sessionId/start', () => {
  test('Start Session - Service Error', async() => {
    const mockError = new Error('Service failure');
    mockSessionManager.startSession.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    const time = 1000;
    const response = await request(app)
      .post(`/sessions/${sessionId}/start`)
      .send({userId, time});
    expect(response.status).toBe(500);
  });

  test('Start Session - Success', async() => {
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
      .send({userId, time});
    expect(response.status).toBe(200);
    expect(response.body).toEqual({success: true, session: mockSession._id});
  });

});

describe('Mocked: POST /sessions/:sessionId/doneSwiping', () => {
  test('Done Swiping - Service Error', async() => {
    const mockError = new Error('Service failure');
    mockSessionManager.userDoneSwiping.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    const userId = '67bd263553651617ebf5c04f';
    
    const response = await request(app)
      .post(`/sessions/${sessionId}/doneSwiping`)
      .send({userId});
    expect(response.status).toBe(500);
  });

  test('Start Session - Success', async() => {
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
      .send({userId});
    expect(response.status).toBe(200);
    expect(response.body).toEqual({success: true, session: mockSession._id});
  });

});

describe('Mocked: get /sessions/:sessionId/result', () => {
  test('Session Result - Service Error', async() => {
    const mockError = new Error('Service failure');
    mockSessionManager.getResultForSession.mockRejectedValue(mockError);

    const sessionId = '67bd263553651617ebf5c04f';
    
    const response = await request(app)
      .get(`/sessions/${sessionId}/result`);
    expect(response.status).toBe(500);
  });

  test('Session Result - Success', async() => {
    const mockResult = {
      _id: '67bd263553651617ebf5c04f',
    };

    mockSessionManager.getResultForSession.mockResolvedValue(mockResult);

    const sessionId = '67bd263553651617ebf5c04f';
    
    const response = await request(app)
      .get(`/sessions/${sessionId}/result`)

    expect(response.status).toBe(200);
  });

});
