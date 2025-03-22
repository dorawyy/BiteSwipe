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
    
    findOneAndUpdate: jest.fn().mockImplementation((query, update) => {
      // Mock for sessionSwiped
      if(query._id.toString() === '67db3be580163bf1328c0211') {
        return Promise.resolve(null);
      }  

      if(query._id.toString() === '67db3be580163bf1328c0212') {
        return Promise.resolve({
          _id: query._id,
          status: 'MATCHING',
          doneSwiping: [],
          save: jest.fn().mockResolvedValue({})
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
    jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);

    // Create app using shared createApp function
    app = createApp();
    agent = request.agent(app);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  test('Done Swiping Invalid id format', async () => {
    const response = await agent
        .post('/sessions/67db3be580163bf1328c0211/doneSwiping')
        .send({
            userId: 'invalid-id',
        });
    expect(response.status).toBe(500);
  });

  test('Done Swiping complete',async () => {
    const response = await agent
        .post('/sessions/67db3be580163bf1328c0212/doneSwiping')
        .send({
            userId: '67db3be580163bf1328c0213',
        });
        console.log(response.body);
        expect(response.status).toBe(200);
  });

});