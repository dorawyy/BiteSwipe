import mongoose from "mongoose";
import './mocked_setup';
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../app";

jest.mock('mongoose', () => {
  class ObjectId {
    private str: string;
    
    constructor(str: string) {
      this.str = str;
    }

    toString() {
      return this.str;
    }

    equals(other: unknown) {
      return other?.toString() === this.str;
    }

    static isValid() {
      return true;
    }
  }

  return {
    ...jest.requireActual('mongoose'),
    Types: {
      ObjectId
    }
  };
});

jest.mock('../../models/restaurant', () => {
  const RestaurantModel = jest.fn().mockImplementation(function (this: Record<string,unknown> , data) {
    this.name = data.name;
    this.location = data.location;
    this.contact = data.contact;
    this.menu = data.menu;
    this.images = data.images;
    this.priceLevel = data.priceLevel;
    this.rating = data.rating;
    this.openingHours = data.openingHours;
    this.save = jest.fn().mockResolvedValue(this);
  });
  Object.assign(RestaurantModel, {

  });
})

jest.mock('../../models/user', () => {
  const UserModel = jest.fn().mockImplementation(function (this: Record<string, unknown>, data) {
    // Mock the constructor instance variables
    this.email = data.email;
    this.displayName = data.displayName;
    this.sessionHistory = data.sessionHistory || [];
    this.restaurantInteractions = data.restaurantInteractions || [];

    // Mock `.save()` method on the instance
    this.save = jest.fn().mockResolvedValue({
      _id: 'newUserId',
      email: this.email,
      displayName: this.displayName,
      sessionHistory: this.sessionHistory,
      restaurantInteractions: this.restaurantInteractions,
    });
  });

  // Mock static methods (findOne, findById, create, findByIdAndUpdate)
  Object.assign(UserModel, {
      findOne: jest.fn().mockImplementation((query) => {
        if(query._id.toString() === '67db3be580163bf1328c0250'){ 
          return Promise.resolve(null);
        } 
        const createResponse = (data: any) => ({
            lean: () => Promise.resolve(data),
            select: () => ({
              lean: () => Promise.resolve(data),
            }),
          });
          
          if(query.email === 'test@test.com'){
            return Promise.resolve(null);
          }
          if (query.email === 'test@example.com') {
            return createResponse({
              _id: 'existingUserId',
              email: 'test@example.com',
              displayName: 'Test User',
            });
          }
          return createResponse(null);
        }),

    findById: jest.fn().mockImplementation((id) => {
      const response = {
          select: () => response, // Ensure select() is always chainable
          lean: () => Promise.resolve({
            _id: id,
            email: 'test@example.com',
            displayName: 'Test User',
          }),
        };
    
        if (id.toString() === 'invalid-id') {
          return Promise.reject(new Error('Invalid ID'));
        } else if (id.toString() === '67db3be580163bf1328c0250') {
          return Promise.resolve(null as unknown);
        } else if (id.toString() === '67db3be580163bf1328c0251') {
          return Promise.reject(new Error('Database error while fetching user by ID'));
        }
      
        return response;
    }),

    create: jest.fn().mockImplementation((data) => {
      // Check for a specific email that should trigger an error
      if (data.email === 'error@example.com') {
        return Promise.reject(new Error('Database error while creating user'));
      }
      // Normal case - return the created user
      return Promise.resolve({ _id: 'newUserId', ...data });
    }),

    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      if (id.toString() === 'invalid-id') {
        return Promise.reject(new Error('Invalid ID'));
      }
      if (id.toString() === 'nonexistentId') {
        return Promise.resolve(null);
      }
      return Promise.resolve({ ...update, _id: id });
    }),
  });

  return { UserModel };
});

jest.mock('../../models/session', () => {
  const SessionModel = jest.fn().mockImplementation(function (this: Record<string, unknown>, data) {
    if(data.creator === '67db3be580163bf1328c0213') {
      throw new Error('Database error while creating session');
    }
    this.joinCode = data.joinCode;
    this.creator = data.creator;
    this.participants = data.participants || [];
    this.pendingInvitations = data.pendingInvitations || [];
    this.status = data.status;
    this.settings = data.settings;
    this.restaurants = data.restaurants || [];
    this.finalSelection = data.finalSelection;
    this.doneSwiping = data.doneSwiping || [];
    this.createdAt = data.createdAt;
    this.expiresAt = data.expiresAt;
    this.save = jest.fn().mockResolvedValue(this);
  });
  
  Object.assign(SessionModel, {
    findOne: jest.fn().mockImplementation((query) => {
      // Mock for checking if join code exists
      if(query._id.toString() === '67db3be580163bf1328c0250'){
        return Promise.resolve(null);
      }
      if (query._id === '67db3be580163bf1328c0220'){
        return Promise.resolve({
          _id: '67db3be580163bf1328c0220',
          joinCode: 'EXIST',
          status: 'CREATED'
        });
      }
      if (query.joinCode === 'EXIST') {
        return Promise.resolve({
          _id: 'existingSessionId',
          joinCode: 'EXIST',
          status: 'CREATED'
        });
      }
      
      // Mock for session with pending invitations
      if (query._id && query._id.toString() === 'sessionWithInvites') {
        return Promise.resolve({
          _id: 'sessionWithInvites',
          status: 'CREATED',
          participants: [{ userId: { equals: (id: unknown) => id === 'userId1' } }],
          pendingInvitations: [{ equals: (id: unknown) => id === 'invitedUserId' }]
        });
      }
      
      // Mock for checking if user already swiped
      if (query._id && query.participants?.$elemMatch?.userId) {
        return Promise.resolve({
          _id: query._id,
          participants: [
            {
              userId: query.participants.$elemMatch.userId,
              preferences: [{ restaurantId: 'restaurant1' }]
            }
          ]
        });
      }
      
      return Promise.resolve(null);
    }),
    
    findById: jest.fn().mockImplementation((id) => {
      if (id.toString() === 'nonexistentId') {
        return Promise.resolve(null);
      }
      
      if (id.toString() === 'completedSessionId') {
        return Promise.resolve({
          _id: id,
          status: 'COMPLETED' as const,
          creator: { equals: (userId: string): boolean => userId === 'creatorId' },
          participants: [
            { userId: { equals: (userId: string): boolean => userId === 'userId1' || userId === 'creatorId' } }
          ],
          restaurants: [{ restaurantId: 'restaurant1', positiveVotes: 0, totalVotes: 0, score: 0 }],
          doneSwiping: [] as string[],
          save: jest.fn().mockResolvedValue({}) as jest.Mock<Promise<object>>
        });
      }
      
      return Promise.resolve({
        _id: id,
        status: 'MATCHING',
        creator: { equals: (userId: unknown) => userId === 'creatorId' },
        participants: [
          { 
            userId: { equals: (userId: unknown) => userId === 'userId1' || userId === 'creatorId' },
            preferences: []
          }
        ],
        restaurants: [{ restaurantId: { toString: () => 'restaurant1' }, positiveVotes: 0, totalVotes: 0, score: 0 }],
        doneSwiping: [{ equals: (userId: unknown) => userId === 'userId1' }],
        save: jest.fn().mockResolvedValue({})
      });
    }),
    
    findOneAndUpdate: jest.fn().mockImplementation((query, update) => {
      // Mock for sessionSwiped
      if(query._id.toString() === 'invalid-id') {
        return Promise.reject(new Error('Invalid session ID'));
      }
      if(query?.['participants.userId'].toString() === 'invalid-id') {
        return Promise.reject(new Error('Invalid user ID'));
      }

      if(query._id.toString() === '67db3be580163bf1328c0250'){
        return Promise.resolve(null);
      }

      if(query._id.toString() === '67db3be580163bf1328c0250'){
        return Promise.resolve(null);
      }

      if (query._id && query.status?.$eq === 'MATCHING') {
        if (query.participants?.$not?.$elemMatch?.userId) {
          // User already swiped on this restaurant
          return Promise.resolve(null);
        }
        return Promise.resolve({
          _id: query._id,
          status: 'MATCHING',
          participants: [
            {
              userId: query.participants.userId,
              preferences: [...(update.$push?.['participants.$.preferences'] ? [update.$push['participants.$.preferences']] : [])]
            }
          ]
        });
      }
      
      // Mock for addPendingInvitation
      if (query.pendingInvitations?.$ne) {
        return Promise.resolve({
          _id: query._id,
          pendingInvitations: [...(update.$push?.pendingInvitations ? [update.$push.pendingInvitations] : [])],
          doneSwiping: [...(update.$push?.doneSwiping ? [update.$push.doneSwiping] : [])]
        });
      }
      
      // Mock for joinSession
      if (query.joinCode) {
        return Promise.resolve({
          _id: 'sessionId',
          joinCode: query.joinCode,
          status: 'CREATED',
          pendingInvitations: query.pendingInvitations ? 
            [query.pendingInvitations].filter(id => !update.$pull.pendingInvitations.equals(id)) : [],
          participants: [...(update.$push?.participants ? [update.$push.participants] : [])]
        });
      }
      
      // Mock for startSession
      if (query.creator && query.status === 'CREATED') {
        return Promise.resolve({
          _id: query._id,
          creator: query.creator,
          status: update.status
        });
      }
      
      // Mock for userDoneSwiping
      if (query.status === 'MATCHING' && update.$pull?.doneSwiping) {
        return Promise.resolve({
          _id: query._id,
          status: 'MATCHING',
          doneSwiping: [],
          save: jest.fn().mockResolvedValue({})
        });
      }
      
      // Mock for leaveSession
      if (update.$pull?.participants) {
        return Promise.resolve({
          _id: query._id,
          participants: []
        });
      }
      
      // Mock for rejectInvitation
      if (update.$pull?.pendingInvitations) {
        return Promise.resolve({
          _id: query._id,
          pendingInvitations: []
        });
      }
      
      return Promise.resolve(null);
    }),
    
    find: jest.fn().mockImplementation(() => {
      return {
        sort: () => Promise.resolve([
          {
            _id: 'sessionId1',
            creator: 'creatorId',
            participants: [{ userId: 'userId1' }],
            pendingInvitations: [],
            status: 'CREATED',
            restaurants: [{ restaurantId: 'restaurant1' }]
          },
          {
            _id: 'sessionId2',
            creator: 'creatorId2',
            participants: [{ userId: 'userId1' }],
            pendingInvitations: [],
            status: 'MATCHING',
            restaurants: [{ restaurantId: 'restaurant2' }]
          }
        ])
      };
    }),
    
    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      return Promise.resolve({
        _id: id,
        ...update
      });
    })
  });
  
  return { 
    Session: SessionModel,
    ISession: jest.fn(),
    SessionStatus: { 
      CREATED: 'CREATED', 
      MATCHING: 'MATCHING', 
      COMPLETED: 'COMPLETED' 
    }
  };
});

describe("POST /sessions/:sessionId/votes - Mocked", () => {
  let app: Express;
  let agent: request.Agent;

  beforeAll(() => {
    // No setup needed in beforeAll
    jest.clearAllMocks();
  });

  afterAll(() => {
    // No need to disconnect from mongoose as it's mocked
    jest.resetAllMocks();
  });

  beforeEach(() => {
    // Ensure mongoose.connect is mocked and doesn't try to connect to a real DB
    jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as unknown as typeof mongoose);

    // Create app using shared createApp function
    app = createApp();
    agent = request.agent(app);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  test('Invalid session ID', async () => {
    const response = await agent
        .post('/sessions/invalid-id/votes')
        .send({
            userId: 'userId1',
            restaurantId: 'restaurant1',
            liked: true
        });
    expect(response.status).toBe(500);
  });

  test('Invalid user Id ', async () => {
    const response = await agent
        .post('/sessions/67db3be580163bf1328c0250/votes')
        .send({
            userId: 'invalid-id',
            restaurantId: 'restaurant1',
            liked: true
        });
    expect(response.status).toBe(500);
  });

  test('Session does not exists', async () => {
    const response = await agent 
        .post('/sessions/67db3be580163bf1328c0250/votes')
        .send({
            userId: 'userId1',
            restaurantId: 'restaurant1',
            liked: true
        });

    expect(response.status).toBe(500);
  });

  test('User already swiped on this restaurant', async () => {
    const response = await agent
        .post('/sessions/67db3be580163bf1328c0220/votes')
        .send({
            userId: 'userId1',
            restaurantId: 'restaurant1',
            liked: true
        });

    expect(response.status).toBe(500);
   
  });

});