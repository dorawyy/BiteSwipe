// Import from setup.ts to use the centralized mocks for other dependencies

import './unittest_setup';

import { Types } from "mongoose";
import request from "supertest";
import express from "express";
import { RestaurantService } from "../../services/restaurantService";
import { SessionManager } from "../../services/sessionManager";
import { SessionController } from "../../controllers/sessionController";
// Mock the validateRequest middleware instead of importing the real one
const validateRequest = jest.fn((req, res, next) => {
  // For the votes endpoint, validate required fields
  if (req.path.includes('/votes')) {
    if (!req.body.userId) {
      return res.status(400).json({ errors: [{ msg: 'User ID is required' }] });
    }
    if (!req.body.restaurantId) {
      return res.status(400).json({ errors: [{ msg: 'Restaurant ID is required' }] });
    }
    if (typeof req.body.liked !== 'boolean') {
      return res.status(400).json({ errors: [{ msg: 'Liked must be a boolean' }] });
    }
  }
  next();
});
import { UserService } from "../../services/userService";

// Mock the express router
const app = express();
app.use(express.json());

// Mock restaurant data
const mockRestaurants = [
  {
    _id: new Types.ObjectId("000000000000000000000001"),
    name: "Test Restaurant 1",
    location: {
      address: "123 Test St",
      coordinates: { latitude: 49.2827, longitude: -123.1207 },
    },
    rating: 4.5,
    priceLevel: 2,
    toObject: () => ({
      _id: "000000000000000000000001",
      name: "Test Restaurant 1",
      location: {
        address: "123 Test St",
        coordinates: { latitude: 49.2827, longitude: -123.1207 },
      },
      rating: 4.5,
      priceLevel: 2,
    }),
  },
  {
    _id: new Types.ObjectId("000000000000000000000002"),
    name: "Test Restaurant 2",
    location: {
      address: "456 Test Ave",
      coordinates: { latitude: 49.2827, longitude: -123.1207 },
    },
    rating: 4.0,
    priceLevel: 3,
    toObject: () => ({
      _id: "000000000000000000000002",
      name: "Test Restaurant 2",
      location: {
        address: "456 Test Ave",
        coordinates: { latitude: 49.2827, longitude: -123.1207 },
      },
      rating: 4.0,
      priceLevel: 3,
    }),
  },
];

// Mock session data with required fields from ISession
const mockSession = {
  _id: new Types.ObjectId("000000000000000000000003"),
  name: "Test Session",
  creator: new Types.ObjectId("000000000000000000000004"),
  joinCode: "ABC123",
  participants: [
    {
      userId: new Types.ObjectId("000000000000000000000004"),
      preferences: [],
    },
  ],
  restaurants: [
    { restaurantId: new Types.ObjectId("000000000000000000000001") },
    { restaurantId: new Types.ObjectId("000000000000000000000002") },
  ],
  pendingInvitations: [],
  status: "ACTIVE",
  settings: {
    latitude: 49.2827,
    longitude: -123.1207,
    radius: 1000,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
  toObject: () => ({
    _id: "000000000000000000000003",
    name: "Test Session",
    status: "ACTIVE",
  }),
};

describe("Restaurant API Endpoints", () => {
  let mockRestaurantService: jest.Mocked<RestaurantService>;
  let mockSessionManager: jest.Mocked<SessionManager>;
  let mockUserService: jest.Mocked<UserService>;
  let sessionController: SessionController;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock instances
    mockRestaurantService = {
      getRestaurants: jest.fn(),
      getRestaurant: jest.fn(),
      addRestaurants: jest.fn(),
    } as unknown as jest.Mocked<RestaurantService>;

    mockUserService = {
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    mockSessionManager = {
      getRestaurantsInSession: jest.fn(),
      sessionSwiped: jest.fn(),
      getSession: jest.fn(),
      startSession: jest.fn(),
      userDoneSwiping: jest.fn(),
      getResultForSession: jest.fn(),
    } as unknown as jest.Mocked<SessionManager>;

    // Create controller with mocked dependencies
    sessionController = new SessionController(
      mockSessionManager,
      mockUserService
    );

    // Set up routes
    app.get("/sessions/:sessionId/restaurants", (req, res) => {
      sessionController.getRestaurantsInSession(req, res);
    });

    // Set up the votes route with the mock validation middleware
    app.post("/sessions/:sessionId/votes", validateRequest, (req, res) => {
      sessionController.sessionSwiped(req, res);
    });

    // Set up the start session route
    app.post("/sessions/:sessionId/start", (req, res) => {
      sessionController.startSession(req, res);
    });

    // Set up the user done swiping route
    app.post("/sessions/:sessionId/done", (req, res) => {
      sessionController.userDoneSwiping(req, res);
    });

    // Set up the get result for session route
    app.get("/sessions/:sessionId/result", (req, res) => {
      sessionController.getResultForSession(req, res);
    });
  });

  describe("GET /sessions/:sessionId/restaurants", () => {
    test("should return restaurants for a session", async () => {
      // Input: Valid session ID
      // Expected behavior: Returns restaurants for the session
      // Expected output: Array of restaurant objects

      // Setup mocks
      mockSessionManager.getRestaurantsInSession.mockResolvedValue(
        mockRestaurants as any
      );

      // Make request
      const response = await request(app)
        .get("/sessions/000000000000000000000003/restaurants")
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toBeDefined();
      expect(mockSessionManager.getRestaurantsInSession).toHaveBeenCalledWith(
        "000000000000000000000003"
      );
    });
  });

  test("should handle errors when fetching restaurants", async () => {
    // Input: Valid session ID but service throws error
    // Expected behavior: Returns 500 error
    // Expected output: Error message

    // Setup mocks to simulate error
    const error = new Error("Failed to fetch restaurants") as Error & {
      code?: string;
    };
    mockSessionManager.getRestaurantsInSession.mockRejectedValue(error);

    // Make request
    const response = await request(app)
      .get("/sessions/000000000000000000000003/restaurants")
      .expect("Content-Type", /json/)
      .expect(500);

    // Verify response contains error
    expect(response.body).toHaveProperty("error");
    expect(mockSessionManager.getRestaurantsInSession).toHaveBeenCalledWith(
      "000000000000000000000003"
    );
  });

  test("should return 404 when session is not found", async () => {
    // Input: Invalid session ID
    // Expected behavior: Returns 404 error
    // Expected output: Error message

    // Setup mocks to simulate session not found
    const error = new Error("Session not found") as Error & { code?: string; };
    error.code = "SESSION_NOT_FOUND";
    mockSessionManager.getRestaurantsInSession.mockRejectedValue(error);

    // Make request
    const response = await request(app)
      .get("/sessions/000000000000000000000099/restaurants")
      .expect("Content-Type", /json/)
      .expect(404);

    // Verify response contains error
    expect(response.body).toHaveProperty("error", "Session not found");
    expect(mockSessionManager.getRestaurantsInSession).toHaveBeenCalledWith(
      "000000000000000000000099"
    );
  });

  describe("POST /sessions/:sessionId/votes", () => {
    test("should record a restaurant vote (like)", async () => {
      // Input: Session ID, user ID, restaurant ID, and liked=true
      // Expected behavior: Records the vote and returns success
      // Expected output: Success message with session ID

      // Setup mocks
      mockSessionManager.sessionSwiped.mockResolvedValue(mockSession as any);

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/votes")
        .send({
          userId: "000000000000000000000004",
          restaurantId: "000000000000000000000001",
          liked: true,
        })
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("session");
      expect(mockSessionManager.sessionSwiped).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004",
        "000000000000000000000001",
        true
      );
    });
  });

  describe("POST /sessions/:sessionId/votes", () => {
    test("should record a restaurant vote (like)", async () => {
      // Input: Session ID, user ID, restaurant ID, and liked=true
      // Expected behavior: Records the vote and returns success
      // Expected output: Success message with session ID

      // Setup mocks
      mockSessionManager.sessionSwiped.mockResolvedValue(mockSession as any);

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/votes")
        .send({
          userId: "000000000000000000000004",
          restaurantId: "000000000000000000000001",
          liked: true,
        })
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("session");
      expect(mockSessionManager.sessionSwiped).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004",
        "000000000000000000000001",
        true
      );
    });

    test("should record a restaurant vote (dislike)", async () => {
      // Input: Session ID, user ID, restaurant ID, and liked=false
      // Expected behavior: Records the vote and returns success
      // Expected output: Success message with session ID

      // Setup mocks
      mockSessionManager.sessionSwiped.mockResolvedValue(mockSession as any);

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/votes")
        .send({
          userId: "000000000000000000000004",
          restaurantId: "000000000000000000000001",
          liked: false,
        })
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("session");
      expect(mockSessionManager.sessionSwiped).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004",
        "000000000000000000000001",
        false
      );
    });

    test("should record a restaurant vote (dislike)", async () => {
      // Input: Session ID, user ID, restaurant ID, and liked=false
      // Expected behavior: Records the vote and returns success
      // Expected output: Success message with session ID

      // Setup mocks
      mockSessionManager.sessionSwiped.mockResolvedValue(mockSession as any);

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/votes")
        .send({
          userId: "000000000000000000000004",
          restaurantId: "000000000000000000000001",
          liked: false,
        })
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("session");
      expect(mockSessionManager.sessionSwiped).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004",
        "000000000000000000000001",
        false
      );
    });

    test("should handle errors when recording vote", async () => {
      // Input: Valid data but service throws error
      // Expected behavior: Returns 500 error
      // Expected output: Error message

      // Setup mocks to simulate error
      mockSessionManager.sessionSwiped.mockRejectedValue(
        new Error("Failed to record vote")
      );

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/votes")
        .send({
          userId: "000000000000000000000004",
          restaurantId: "000000000000000000000001",
          liked: true,
        })
        .expect("Content-Type", /json/)
        .expect(500);

      // Verify response contains error
      expect(response.body).toHaveProperty("error");
      expect(mockSessionManager.sessionSwiped).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004",
        "000000000000000000000001",
        true
      );
    });

    test("should handle missing required fields", async () => {
      // Input: Session ID but missing userId
      // Expected behavior: Returns 400 validation error
      // Expected output: Validation error message

      // Make request with missing userId
      const response = await request(app)
        .post("/sessions/000000000000000000000003/votes")
        .send({
          restaurantId: "000000000000000000000001",
          liked: true,
        })
        .expect("Content-Type", /json/)
        .expect(400);

      // Verify response contains validation error
      expect(response.body).toHaveProperty("errors");
      expect(mockSessionManager.sessionSwiped).not.toHaveBeenCalled();
    });
  });

  describe("POST /sessions/:sessionId/start", () => {
    test("should start a session successfully", async () => {
      // Input: Session ID and user ID
      // Expected behavior: Starts the session and returns success
      // Expected output: Success message with session ID

      // Setup mocks
      mockSessionManager.startSession.mockResolvedValue(mockSession as any);

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/start")
        .send({
          userId: "000000000000000000000004",
          time: 3600 // 1 hour in seconds
        })
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("session");
      expect(mockSessionManager.startSession).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004",
        3600
      );
    });

    test("should handle errors when starting a session", async () => {
      // Input: Valid session ID but service throws error
      // Expected behavior: Returns 500 error
      // Expected output: Error message

      // Setup mocks to simulate error
      mockSessionManager.startSession.mockRejectedValue(new Error("Failed to start session"));

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/start")
        .send({
          userId: "000000000000000000000004",
          time: 3600
        })
        .expect("Content-Type", /json/)
        .expect(500);

      // Verify response contains error
      expect(response.body).toHaveProperty("error");
      expect(mockSessionManager.startSession).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004",
        3600
      );
    });
  });

  describe("POST /sessions/:sessionId/done", () => {
    test("should mark user as done swiping successfully", async () => {
      // Input: Session ID and user ID
      // Expected behavior: Marks the user as done swiping and returns success
      // Expected output: Success message with session ID

      // Setup mocks
      mockSessionManager.userDoneSwiping.mockResolvedValue(mockSession as any);

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/done")
        .send({
          userId: "000000000000000000000004"
        })
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("session");
      expect(mockSessionManager.userDoneSwiping).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004"
      );
    });

    test("should handle errors when marking user as done swiping", async () => {
      // Input: Valid session ID but service throws error
      // Expected behavior: Returns 500 error
      // Expected output: Error message

      // Setup mocks to simulate error
      mockSessionManager.userDoneSwiping.mockRejectedValue(new Error("Failed to mark user as done swiping"));

      // Make request
      const response = await request(app)
        .post("/sessions/000000000000000000000003/done")
        .send({
          userId: "000000000000000000000004"
        })
        .expect("Content-Type", /json/)
        .expect(500);

      // Verify response contains error
      expect(response.body).toHaveProperty("error");
      expect(mockSessionManager.userDoneSwiping).toHaveBeenCalledWith(
        "000000000000000000000003",
        "000000000000000000000004"
      );
    });
  });

  describe("GET /sessions/:sessionId/result", () => {
    test("should get the result for a session successfully", async () => {
      // Input: Session ID
      // Expected behavior: Returns the result for the session
      // Expected output: Success message with result

      // Mock result data
      const mockResult = {
        _id: "000000000000000000000001",
        name: "Test Restaurant",
        address: "123 Test St",
        votes: 3
      } as any; // Cast as any to bypass type checking for the mock

      // Setup mocks
      mockSessionManager.getResultForSession.mockResolvedValue(mockResult);

      // Make request
      const response = await request(app)
        .get("/sessions/000000000000000000000003/result")
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("result");
      expect(response.body.result).toEqual(mockResult);
      expect(mockSessionManager.getResultForSession).toHaveBeenCalledWith(
        "000000000000000000000003"
      );
    });

    test("should handle errors when getting result for a session", async () => {
      // Input: Valid session ID but service throws error
      // Expected behavior: Returns 500 error
      // Expected output: Error message

      // Setup mocks to simulate error
      mockSessionManager.getResultForSession.mockRejectedValue(new Error("Failed to get result for session"));

      // Make request
      const response = await request(app)
        .get("/sessions/000000000000000000000003/result")
        .expect("Content-Type", /json/)
        .expect(500);

      // Verify response contains error
      expect(response.body).toHaveProperty("error");
      expect(mockSessionManager.getResultForSession).toHaveBeenCalledWith(
        "000000000000000000000003"
      );
    });
  });
});
