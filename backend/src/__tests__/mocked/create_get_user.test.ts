import './mocked_setup';
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../app";
import mongoose from 'mongoose';

jest.mock('mongoose', () => {
    class ObjectId {
      private str: string;
      
      constructor(str: string) {
        this.str = str;
      }
  
      toString() {
        return this.str;
      }
  
      toJSON() {
        return this.str;
      }
  
      equals(other: any) {
        return other?.toString() === this.str;
      }
  
      static isValid(str: string) {
        return true;
      }
    }
  
    return {
      Types: {
        ObjectId
      }
    };
  });
  
  jest.mock('../../models/user', () => {
    const UserModel = jest.fn().mockImplementation(function (this: any, data) {
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
            response.lean = () => Promise.reject(new Error('Invalid ID'));
          } else if (id.toString() === '67db3be580163bf1328c0250') {
            response.lean = () => Promise.resolve(null as any);
          } else if (id.toString() === '67db3be580163bf1328c0251') {
            response.lean = () => Promise.reject(new Error('Database error while fetching user by ID'));
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
  

describe("POST /users and GET /users/:userId - Mocked", () => {
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

  /**
   * Test: Internal server error when fetching user by email
   * Input: Valid email format but service throws an error
   * Expected behavior: UserService.getUserByEmail throws an error
   * Expected output: 500 status with error message
   */
  test("Creating user succesfully", async () => {

    const response = await agent 
      .post('/users')
      .send({
        email: 'user-create@create.com',
        displayName: 'user-create'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.email).toBe('user-create@create.com');
  });

  test("Throwing error email and displayName are required", async () => {

    const response = await agent
      .post('/users')
      .send({
        email: 'hello@hello.com',
      });
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe('Display name is required');

   const response2 = await agent
      .post('/users')
      .send({
        displayName: 'hello',
      }); 
    
    expect(response2.status).toBe(400);
    expect(response2.body.errors[0].msg).toBe('Valid email is required');
      
  });

  test("Throwing error user already exists", async () => {

    const response = await agent
        .post('/users')
        .send({
            email: 'test@example.com',
            displayName: 'Test User'
        });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('User with this email already exists');
  });

  test("Throwing error failed to create user (DB error)", async () => {
    
    const response = await agent 
        .post('/users')
        .send({
            email: 'error@example.com',
            displayName: 'Error User'
        });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal Server Error');
  });

  test("Invalid user id format", async () => {
    const response = await agent
        .get('/users/invalid-id');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid user ID format');   

  });

  test('User not found', async () => {
    const response = await agent
        .get('/users/67db3be580163bf1328c0250');
    
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  test('DB error while fetching user by Id', async () => {
    const response = await agent
            .get('/users/67db3be580163bf1328c0251');
            
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal Server Error');
  });

  test('Fetching user by Id', async () => {
    const response = await agent
        .get('/users/67db3be580163bf1328c0249');

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('test@example.com');
  });

  test('get user by email', async () => {
    const response = await agent
        .get('/users/emails/test@example.com')
    expect(response.status).toBe(200);
  });

  test('get user by email error', async () => {
    const response = await agent
        .get('/users/emails/test@test.com');
    expect(response.status).toBe(500);
  });
});
