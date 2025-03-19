import { config } from 'dotenv';
import path from 'path';
import { Model } from 'mongoose';

// Load test environment variables
config({ path: path.join(__dirname, 'test.env') });



// ---------------------------------------------------------
// Mongoose
//
const mockSchema = {
  add: jest.fn(),
  index: jest.fn()
};

const mockSchemaType = {
  ObjectId: String
};

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

    static isValid = jest.fn().mockImplementation((str: string) => {
      return str !== 'invalid-id';
    });
  }

  return {
    ...jest.requireActual('mongoose'),
    connect: jest.fn().mockResolvedValue({}),
    model: jest.fn().mockReturnValue({
      findById: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn()
    }),
    Schema: Object.assign(
      jest.fn().mockImplementation(() => mockSchema),
      { Types: mockSchemaType }
    ),
    Types: {
      ObjectId
    }
  };
});

// ---------------------------------------------------------
// Google Maps
//
jest.mock('../services/externalAPIs/googleMaps', () => ({
  GooglePlacesService: jest.fn().mockImplementation(() => ({
    searchNearby: jest.fn().mockResolvedValue([]),
    getPlaceDetails: jest.fn().mockResolvedValue({})
  }))
}));

// ---------------------------------------------------------
// Firebase
//
jest.mock('../config/firebase', () => ({
  firebaseAdmin: {
    messaging: () => ({
      send: jest.fn().mockResolvedValue('message-id')
    })
  }
}));

// ---------------------------------------------------------
// User Service

interface CustomError extends Error {
  code?: string;
}

// ---------------------------------------------------------
// Restaurant Services
//
const mockRestaurantService = {
  getRestaurants: jest.fn(),
  getRestaurant: jest.fn(),
  addRestaurants: jest.fn()
};

jest.mock('../services/restaurantService', () => ({
  RestaurantService: jest.fn().mockImplementation(() => mockRestaurantService)
}));

// ---------------------------------------------------------
// User Services
//
const mockUserService = {
  getUserById: jest.fn(),
  createUser: jest.fn().mockImplementation((email, displayName) => {
    if (email === 'exists@example.com') {
      const error = new Error('User already exists') as CustomError;
      return Promise.reject(error);
    }
    return Promise.resolve({
      _id: 'newUserId',
      email,
      displayName,
      sessionHistory: [],
      restaurantInteractions: []
    });
  }),
  getUserByEmail: jest.fn().mockImplementation((email) => {
    if (email === 'exists@example.com') {
      return Promise.resolve({
        _id: 'existingId',
        email,
        displayName: 'Existing User',
        sessionHistory: [],
        restaurantInteractions: []
      });
    }
    return Promise.resolve(null);
  }),
  updateFCMToken: jest.fn()
};

jest.mock('../services/userService', () => ({
  UserService: jest.fn().mockImplementation(() => mockUserService)
}));

// ---------------------------------------------------------
// Session Manager
//
const mockSessionManager = {
  createSession: jest.fn(),
  getSession: jest.fn(),
  sessionSwiped: jest.fn(),
  inviteUser: jest.fn(),
  joinSession: jest.fn(),
  getRestaurantsInSession: jest.fn(),
  startSession: jest.fn(),
  rejectInvitation: jest.fn(),
  leaveSession: jest.fn(),
  getResultForSession: jest.fn(),
  userDoneSwiping: jest.fn(),
  addPendingInvitation: jest.fn(),
  getUserSessions: jest.fn().mockImplementation((userId) => {
    if (userId.toString() === 'nonexistentId') {
      return Promise.reject(new Error('User not found'));
    }
    return Promise.resolve([
      {
        _id: 'session1',
        name: 'Test Session 1'
      },
      {
        _id: 'session2',
        name: 'Test Session 2'
      }
    ]);
  })
};
jest.mock('../services/sessionManager', () => ({
  SessionManager: jest.fn().mockImplementation(() => mockSessionManager)
}));

// ---------------------------------------------------------
// UserModel 
//
const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn().mockImplementation((data) => {
    return Promise.resolve({
      ...data,
      _id: 'mocked-id'
    });
  })
};

jest.mock('../models/user', () => ({
  UserModel: mockUserModel
}));



// ---------------------------------------------------------
// Export mocks
//
export {
  mockUserService,
  mockSessionManager,
  mockRestaurantService,
  mockUserModel
};
