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

    static isValid(str: string) {
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


jest.mock('../../models/session', () => {
    const SessionModel = jest.fn().mockImplementation(function (this: any, data) {
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
        if (query.joinCode === 'ABCD1') {
          return Promise.resolve({
            _id: '67db3be580163bf1328c0220',
            joinCode: 'ABCD1',
            status: 'COMPLETED'
          });
        }
        else {
            return Promise.resolve({
                _id: '67db3be580163bf1328c0220',
                joinCode: 'ABCD2',
                status: 'CREATED',
                participants: [
                    {
                        userId: {
                            equals: (id:any) => id === '67db3be580163bf1328c0212'
                        }
                    }
                ]
              });
        }
      }),
      
      
      findOneAndUpdate: jest.fn().mockImplementation(() => {
        // Mock for sessionSwiped
        return Promise.resolve(null);
      }),
      findById: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          _id: '67db3be580163bf1328c0220',
          joinCode: 'ABCD1',
          status: 'COMPLETED'
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
  
    beforeAll(async () => {
      // No setup needed in beforeAll
      jest.clearAllMocks();
    });
  
    afterAll(() => {
      // No need to disconnect from mongoose as it's mocked
      jest.resetAllMocks();
    });
  
    beforeEach(async () => {
      // Ensure mongoose.connect is mocked and doesn't try to connect to a real DB
      jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
  
      // Create app using shared createApp function
      app = createApp();
      agent = request.agent(app);
    });
  
    afterEach(async () => {
      // Clear all mocks after each test
      jest.clearAllMocks();
    });
  
    test('Cannot Join Completed Session', async () => {
      const response = await agent
        .post('/sessions/ABCD1/participants')
        .send({
            userId: '67db3be580163bf1328c0211'
        })
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal server error');  
    });

    test('User not invited', async () => {
        const response = await agent
            .post('/sessions/ABCD2/participants')
            .send({
                userId: '67db3be580163bf1328c0211'
            })
        expect(response.status).toBe(403);
    });
  
  });