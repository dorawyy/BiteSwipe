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
      findById: jest.fn().mockImplementation(() => {
        return Promise.resolve({
            creator: {
                equals: (id: any) => id === '67db3be580163bf1328c0213'
            },
            status: 'CREATED',
        })
      }),
      
      
      findOneAndUpdate: jest.fn().mockImplementation(() => {
        // Mock for sessionSwiped
        return Promise.resolve(null);
      }),
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

  describe("DELETE /sessions/:sessionId/participants/:userId' ", () => {
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
        .delete('/sessions/67db3be580163bf1328c0211/participants/67db3be580163bf1328c0211')
        
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('User is not a participant in this session')   
    });
  
  });