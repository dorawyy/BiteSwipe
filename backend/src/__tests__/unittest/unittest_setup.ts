import { config } from "dotenv";
import path from "path";
import mongoose from "mongoose";

// Load test environment variables
config({ path: path.join(__dirname, "../../../.env") });

// Set environment variables for test mode
process.env.NODE_ENV = 'test';
process.env.TEST_TYPE = 'unittest';

// ---------------------------------------------------------
// Mock Functions
//

/**
 * Creates a mock for the User model with all necessary methods and behaviors
 * @returns A mock User model with create, findOne, findById, and save methods
 */
// Define interfaces for Session model mock
interface SessionData {
  _id?: string;
  joinCode?: string;
  creator: string;
  latitude: number;
  longitude: number;
  radius: number;
  error?: boolean;
}

interface SessionModelInstance {
  _id: string;
  joinCode: string;
  creator: string;
  latitude: number;
  longitude: number;
  radius: number;
  save: jest.Mock;
  toObject: () => SessionData;
}

interface SessionModelConstructor {
  new(data: SessionData): SessionModelInstance;
  create: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
}

/**
 * Creates a mock for the Session model with all necessary methods and behaviors
 * @returns A mock Session model with create, findOne, findById, and save methods
 */
function createSessionModelMock() {
  const SessionModelMock = function (
    this: SessionModelInstance,
    data: SessionData
  ) {
    this._id = data._id || "sessionId1";
    this.joinCode = data.joinCode || "ABC123";
    this.creator = data.creator;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.radius = data.radius;
    //
    // save
    //
    this.save = jest.fn().mockResolvedValue(this);
    this.toObject = () => ({
      _id: this._id,
      joinCode: this.joinCode,
      creator: this.creator,
      latitude: this.latitude,
      longitude: this.longitude,
      radius: this.radius,
    });
  };

  //
  // create
  //
  (SessionModelMock as unknown as SessionModelConstructor).create = jest
    .fn()
    .mockImplementation((data) => {
      if (data.error) {
        return Promise.reject(new Error("Database connection failed"));
      }
      const session =
        new (SessionModelMock as unknown as SessionModelConstructor)(data);
      return Promise.resolve(session);
    });

  //
  // findOne
  //
  SessionModelMock.findOne = jest.fn().mockImplementation((query) => {
    if (query.error) {
      return Promise.reject(new Error("Database connection failed"));
    }
    return Promise.resolve(null);
  });

  //
  // findById
  //
  SessionModelMock.findById = jest.fn().mockImplementation((id) => {
    // Convert id to string for comparison
    const idStr = id.toString();

    console.log("SessionModelMock.findById called with id:", idStr);

    if (idStr === "sessionId1") {
      return Promise.resolve({
        _id: "sessionId1",
        joinCode: "ABC123",
        hostId: "testUserId",
        latitude: 49.2827,
        longitude: -123.1207,
        radius: 5000,
        toObject: () => ({
          _id: "sessionId1",
          joinCode: "ABC123",
          hostId: "testUserId",
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000,
        }),
      });
    }

    return Promise.resolve(null);
  });

  return SessionModelMock;
}

/**
 * Creates a mock for the User model with all necessary methods and behaviors
 * @returns A mock User model with create, findOne, findById, and save methods
 */
function createUserModelMock() {
  // @ts-ignore - Ignoring 'this' type issues in the mock
  const UserModelMock = function (this: any, data: any) {
    this.email = data.email;
    this.displayName = data.displayName;
    this.sessionHistory = data.sessionHistory || [];
    this.restaurantInteractions = data.restaurantInteractions || [];

    //
    // save
    //
    this.save = jest.fn().mockImplementation(() => {
      if (this.email === "existing@example.com") {
        throw new Error("User already exists");
      }
      if (this.email === "error@example.com") {
        throw new Error("Failed to create user");
      }
      return Promise.resolve({
        _id: "newUserId",
        email: this.email,
        displayName: this.displayName,
        sessionHistory: this.sessionHistory,
        restaurantInteractions: this.restaurantInteractions,
        toObject: () => ({
          _id: "newUserId",
          email: this.email,
          displayName: this.displayName,
          sessionHistory: this.sessionHistory,
          restaurantInteractions: this.restaurantInteractions,
        }),
      });
    });
  };

  //
  // create
  //
  UserModelMock.create = jest.fn().mockImplementation((data) => {
    if (data.email === "error@example.com") {
      throw new Error("Failed to create user");
    }
    if (data.email === "existing@example.com") {
      throw new Error("User already exists");
    }
    return Promise.resolve({
      _id: "newUserId",
      ...data,
      toObject: () => ({
        _id: "newUserId",
        ...data,
      }),
    });
  });

  //
  // findOne
  //
  UserModelMock.findOne = jest.fn().mockImplementation((query) => {
    // Create a mock object with lean method
    const mockObj = {
      lean: jest.fn()
    };

    // Only return existing user for specific email addresses
    if (query && query.email === "existing@example.com") {
      mockObj.lean = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: "existingUserId",
          email: "existing@example.com",
          displayName: "Existing User"
        })
      });
      return mockObj;
    }
    // Simulate server error for specific email
    if (query && query.email === "error@example.com") {
      mockObj.lean = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error("Database error"))
      });
      return mockObj;
    }
    // Return null for all other emails (including valid@example.com)
    mockObj.lean = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null)
    });
    return mockObj;
  });

  //
  // findById
  //
  UserModelMock.findById = jest.fn().mockImplementation((id) => {
    // Convert id to string for comparison
    const idStr = id.toString();

    console.log("UserModelMock.findById called with id:", idStr);

    if (idStr === "invalid-id") {
      throw new Error("Invalid ID");
    }

    // Create a mock object with lean method
    const mockObj = {
      lean: jest.fn()
    };

    if (idStr === "nonexistentId") {
      mockObj.lean = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });
      return mockObj;
    }
    if (idStr === "server-error") {
      mockObj.lean = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error("Database error"))
      });
      return mockObj;
    }
    if (idStr === "testUserId") {
      mockObj.lean = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: "testUserId",
          email: "test@example.com",
          displayName: "Test User"
        })
      });
      return mockObj;
    }
    mockObj.lean = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: id,
        email: "default@example.com",
        displayName: "Default User"
      })
    });
    return mockObj;
  });

  //
  // findByIdAndUpdate
  //
  UserModelMock.findByIdAndUpdate = jest.fn().mockImplementation((id, update) => {
    // Convert id to string for comparison
    const idStr = id.toString();

    console.log("UserModelMock.findByIdAndUpdate called with id:", idStr);

    if (idStr === "invalid-id") {
      throw new Error("Invalid ID");
    }

    // Create a mock object with lean method
    const mockObj = {
      lean: jest.fn()
    };

    if (idStr === "nonexistentId") {
      mockObj.lean = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });
      return mockObj;
    }
    if (idStr === "server-error") {
      mockObj.lean = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error("Database error"))
      });
      return mockObj;
    }
    if (idStr === "testUserId") {
      mockObj.lean = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: "testUserId",
          email: "test@example.com",
          displayName: "Test User",
          fcmToken: update.fcmToken
        })
      });
      return mockObj;
    }
    mockObj.lean = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: id,
        email: "default@example.com",
        displayName: "Default User",
        fcmToken: update.fcmToken
      })
    });
    return mockObj;
  });

  return UserModelMock;
}

/**
 * Creates a mock for the Restaurant model with all necessary methods and behaviors
 * @returns A mock Restaurant model with create, findOne, findById, find, and save methods
 */
function createRestaurantModelMock() {
  // Define the Restaurant constructor function
  const RestaurantModelMock = function(this: any, data: any) {
    // Copy all properties from data to this instance
    Object.assign(this, data);
    
    // Add save method to instance
    this.save = jest.fn().mockResolvedValue(this);
    
    // Add toObject method
    this.toObject = () => {
      const obj = {...this};
      delete obj.save;
      delete obj.toObject;
      return obj;
    };
  } as any;
  
  // Static methods for the Restaurant model
  RestaurantModelMock.find = jest.fn().mockResolvedValue([]);
  
  RestaurantModelMock.findOne = jest.fn().mockResolvedValue(null);
  
  RestaurantModelMock.findById = jest.fn().mockResolvedValue(null);
  
  RestaurantModelMock.create = jest.fn().mockImplementation((data) => {
    if (data.error) {
      return Promise.reject(new Error("Failed to create restaurant"));
    }
    const restaurant = new RestaurantModelMock(data);
    return Promise.resolve(restaurant);
  });
  
  return RestaurantModelMock;
}

// GooglePlacesService mock
function createGooglePlacesServiceMock() {
  return {
    searchNearby: jest
      .fn()
      .mockImplementation((latitude, longitude, radius, keyword) => {
        console.log("setup::mocked_GooglePlacesService.searchNearby");
        return Promise.resolve([
          {
            place_id: "mock-place-id-1",
            name: "Mock Restaurant 1",
            vicinity: "123 Mock Street",
            geometry: {
              location: {
                lat: latitude,
                lng: longitude,
              },
            },
            rating: 4.5,
            user_ratings_total: 100,
            price_level: 2,
            types: ["restaurant", "food"],
          },
        ]);
      }),
    getPlaceDetails: jest.fn().mockImplementation((placeId) => {
      console.log("setup::mocked_GooglePlacesService.getPlaceDetails");
      return Promise.resolve({
        place_id: placeId,
        name: "Mock Restaurant Details",
        formatted_address: "123 Mock Street, Mock City",
        geometry: {
          location: {
            lat: 49.2827,
            lng: -123.1207,
          },
        },
        formatted_phone_number: "(123) 456-7890",
        website: "https://mockrestaurant.com",
        price_level: 2,
        rating: 4.5,
        user_ratings_total: 100,
        opening_hours: {
          open_now: true,
          weekday_text: [
            "Monday: 9:00 AM – 10:00 PM",
            "Tuesday: 9:00 AM – 10:00 PM",
          ],
        },
        photos_url: ["https://mockphoto1.jpg", "https://mockphoto2.jpg"],
        types: ["restaurant", "food"],
      });
    }),
  };
}

// ---------------------------------------------------------
// External APIs and Services
//

// Create mock instances
const mockUserModel = createUserModelMock();
const mockSessionModel = createSessionModelMock();
const mockRestaurantModel = createRestaurantModelMock();

// Create mock restaurant service
const mockRestaurantService = {
  getRestaurant: jest.fn(),
  getRestaurants: jest.fn(),
  searchRestaurants: jest.fn(),
  addRestaurants: jest.fn()
};

const mockRestaurantInstance = {
  _id: "restaurant123",
  name: "Test Restaurant",
  address: "123 Test St",
  location: { type: "Point", coordinates: [0, 0] },
  priceLevel: 2,
  rating: 4.5,
  userRatingsTotal: 100,
  photoReference: "photo123",
  save: jest.fn().mockResolvedValue({}),
  toObject: jest.fn().mockReturnValue({})
};

// Mock external services
jest.mock("../../services/externalAPIs/googleMaps", () => {
  return {
    GooglePlacesService: jest
      .fn()
      .mockImplementation(() => createGooglePlacesServiceMock()),
  };
});

// Mock SessionManager to ensure consistent join codes and handle all session controller methods
jest.mock("../../services/sessionManager", () => {
  const originalModule = jest.requireActual("../../services/sessionManager");

  return {
    __esModule: true,
    ...originalModule,
    SessionManager: jest.fn().mockImplementation((restaurantService) => {
      const instance = new originalModule.SessionManager(restaurantService);

      // Override the generateUniqueJoinCode method
      instance.generateUniqueJoinCode = jest.fn().mockResolvedValue("ABC123");

      return instance;
    }),
  };
});

// ---------------------------------------------------------
// Mongoose
//
const mockSchema = {
  add: jest.fn(),
  index: jest.fn(),
};

const mockSchemaType = {
  ObjectId: String,
};

jest.mock("mongoose", () => {
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
      return str !== "invalid-id";
    });
  }

  return {
    ...jest.requireActual("mongoose"),
    connect: jest.fn().mockResolvedValue({}),
    model: jest.fn().mockImplementation((modelName) => {
      // Mock User model
      if (modelName === "User") {
        return createUserModelMock();
      }

      // Session model mock
      if (modelName === "Session") {
        return createSessionModelMock();
      }

      // Restaurant model mock
      if (modelName === "Restaurant") {
        return createRestaurantModelMock();
      }

      // Default model mock for other models
      return {
        findById: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      };
    }),
    Schema: Object.assign(
      jest.fn().mockImplementation(() => mockSchema),
      { Types: mockSchemaType }
    ),
    Types: {
      ObjectId,
    },
  };
});

// ---------------------------------------------------------
// Google Maps
//
const mockGooglePlacesService = createGooglePlacesServiceMock();

jest.mock("../../services/externalAPIs/googleMaps", () => ({
  GooglePlacesService: jest
    .fn()
    .mockImplementation(() => mockGooglePlacesService),
}));

// ---------------------------------------------------------
// Firebase
//
jest.mock("firebase-admin", () => ({
  messaging: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue("message-id"),
  }),
  initializeApp: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  default: {
    apps: [],
    messaging: jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue("mock-message-id"),
    }),
  },
  getMessaging: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue("mock-message-id"),
    sendMulticast: jest.fn().mockResolvedValue({ responses: [{ success: true }] })
  }),
}));


//
//
//
// Create mock session manager
const mockSessionManager = {
  createSession: jest.fn(),
  getSession: jest.fn(),
  joinSession: jest.fn(),
  leaveSession: jest.fn(),
  inviteToSession: jest.fn(),
  getRestaurantsInSession: jest.fn(),
  userDoneSwiping: jest.fn(),
  getSessionResults: jest.fn(),
  // Additional methods needed by tests
  addPendingInvitation: jest.fn(),
  rejectInvitation: jest.fn(),
  sessionSwiped: jest.fn(),
  startSession: jest.fn(),
  getResultForSession: jest.fn()
};




// ---------------------------------------------------------
// Mock the Restaurant model itself (not just the instance)
//

// Define a type for the Restaurant mock to satisfy TypeScript
interface RestaurantMock {
  // Instance methods
  save: jest.Mock;
  toObject: () => Record<string, any>;
  
  // Static methods
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  updateOne: jest.Mock;
  deleteOne: jest.Mock;
  aggregate: jest.Mock;
}

interface RestaurantConstructorMock extends jest.Mock {
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  updateOne: jest.Mock;
  deleteOne: jest.Mock;
  aggregate: jest.Mock;
}

// Create a mock for the Restaurant model constructor that supports both static methods and constructor pattern
const RestaurantConstructor = jest.fn().mockImplementation(function(this: any, data: any) {
  // Copy all properties from data to this instance
  Object.assign(this, data);
  
  // Add save method to instance
  this.save = jest.fn().mockResolvedValue(this);
  
  // Add toObject method
  this.toObject = () => {
    const obj = {...this};
    delete obj.save;
    delete obj.toObject;
    return obj;
  };
  
  return this;
}) as RestaurantConstructorMock;

// Add static methods to the constructor function
RestaurantConstructor.find = jest.fn().mockImplementation(() => {
  console.log("Restaurant.find called");
  return {
    exec: jest.fn().mockResolvedValue([mockRestaurantModel])
  };
});

RestaurantConstructor.findOne = jest.fn().mockImplementation(() => {
  console.log("Restaurant.findOne called");
  return {
    exec: jest.fn().mockResolvedValue(mockRestaurantModel)
  };
});

RestaurantConstructor.findById = jest.fn().mockImplementation(() => {
  console.log("Restaurant.findById called");
  return {
    exec: jest.fn().mockResolvedValue(mockRestaurantModel)
  };
});

RestaurantConstructor.create = jest.fn().mockImplementation((data: any) => {
  console.log("Restaurant.create called with:", data);
  return Promise.resolve({
    ...mockRestaurantModel,
    ...data,
    save: jest.fn().mockResolvedValue({}),
    toObject: () => ({ ...data })
  });
});

RestaurantConstructor.updateOne = jest.fn().mockImplementation(() => {
  console.log("Restaurant.updateOne called");
  return {
    exec: jest.fn().mockResolvedValue({ nModified: 1 })
  };
});

RestaurantConstructor.deleteOne = jest.fn().mockImplementation(() => {
  console.log("Restaurant.deleteOne called");
  return {
    exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
  };
});

RestaurantConstructor.aggregate = jest.fn().mockImplementation(() => {
  console.log("Restaurant.aggregate called");
  return {
    exec: jest.fn().mockResolvedValue([mockRestaurantModel])
  };
});

const Restaurant = RestaurantConstructor;

// Mock the Restaurant model import
jest.mock('../../models/restaurant', () => ({
  Restaurant: Restaurant,
  default: Restaurant
}));

// Remove the global Object mock as it's not needed and causing TypeScript errors
// The Restaurant constructor is already properly mocked

// ---------------------------------------------------------
// Export mocks
//
export {
  mockUserModel,
  mockSessionModel,
  mockSessionManager,
  mockRestaurantModel,
  mockGooglePlacesService,
  mockRestaurantInstance,
  mockRestaurantService,
  Restaurant
};
