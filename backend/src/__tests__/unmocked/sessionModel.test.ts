import mongoose from 'mongoose';
import { Session, SessionStatus, ISession } from '../../models/session';

// Mock mongoose connection methods
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      close: jest.fn().mockResolvedValue(undefined),
    },
  };
});

// Interface: Session Model
describe('Unmocked: Session Model', () => {
  // Setup before tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Clean up after tests
  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Input: Valid session data with all required fields
  // Expected behavior: Session is created successfully
  // Expected output: Session object with all fields matching input
  test('should create a session with all required fields', () => {
    // Arrange
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };

    // Mock the save method to return the session
    Session.prototype.save = jest.fn().mockResolvedValue(sessionData);

    // Act
    const session = new Session(sessionData);

    // Assert
    expect(session).toBeDefined();
    expect(session.joinCode).toBe(sessionData.joinCode);
    expect(session.creator.toString()).toBe(sessionData.creator.toString());
    expect(session.settings.location.latitude).toBe(sessionData.settings.location.latitude);
    expect(session.settings.location.longitude).toBe(sessionData.settings.location.longitude);
    expect(session.settings.location.radius).toBe(sessionData.settings.location.radius);
    expect(session.expiresAt).toEqual(sessionData.expiresAt);
    expect(session.status).toBe('CREATED'); // Default value
  });

  // Input: Session data missing required fields (creator)
  // Expected behavior: Validation error is thrown
  // Expected output: Error message indicating missing required field
  test('should throw validation error when missing required fields', () => {
    // Arrange
    const sessionData = {
      joinCode: 'ABC123',
      // Missing creator field
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Act & Assert
    const session = new Session(sessionData);
    const validationError = session.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toBeDefined();
    expect(validationError?.errors.creator).toBeDefined();
  });

  // Input: Valid session data with participants
  // Expected behavior: Session is created with participants
  // Expected output: Session object with participants array
  test('should create a session with participants', () => {
    // Arrange
    const userId = new mongoose.Types.ObjectId();
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      participants: [{
        userId: userId,
        preferences: []
      }],
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Act
    const session = new Session(sessionData);

    // Assert
    expect(session).toBeDefined();
    expect(session.participants).toHaveLength(1);
    expect(session.participants[0].userId.toString()).toBe(userId.toString());
  });

  // Input: Valid session data with restaurants
  // Expected behavior: Session is created with restaurants
  // Expected output: Session object with restaurants array
  test('should create a session with restaurants', () => {
    // Arrange
    const restaurantId = new mongoose.Types.ObjectId();
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      restaurants: [{
        restaurantId: restaurantId,
        score: 0,
        totalVotes: 0,
        positiveVotes: 0
      }],
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Act
    const session = new Session(sessionData);

    // Assert
    expect(session).toBeDefined();
    expect(session.restaurants).toHaveLength(1);
    expect(session.restaurants[0].restaurantId.toString()).toBe(restaurantId.toString());
    expect(session.restaurants[0].score).toBe(0);
    expect(session.restaurants[0].totalVotes).toBe(0);
    expect(session.restaurants[0].positiveVotes).toBe(0);
  });

  // Input: Valid session data with pendingInvitations
  // Expected behavior: Session is created with pendingInvitations
  // Expected output: Session object with pendingInvitations array
  test('should create a session with pendingInvitations', () => {
    // Arrange
    const userId = new mongoose.Types.ObjectId();
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      pendingInvitations: [userId],
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Act
    const session = new Session(sessionData);

    // Assert
    expect(session).toBeDefined();
    expect(session.pendingInvitations).toHaveLength(1);
    expect(session.pendingInvitations[0].toString()).toBe(userId.toString());
  });

  // Input: Valid session data with doneSwiping
  // Expected behavior: Session is created with doneSwiping
  // Expected output: Session object with doneSwiping array
  test('should create a session with doneSwiping users', () => {
    // Arrange
    const userId = new mongoose.Types.ObjectId();
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      doneSwiping: [userId],
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Act
    const session = new Session(sessionData);

    // Assert
    expect(session).toBeDefined();
    expect(session.doneSwiping).toHaveLength(1);
    expect(session.doneSwiping[0].toString()).toBe(userId.toString());
  });

  // Input: Valid session data with finalSelection
  // Expected behavior: Session is created with finalSelection
  // Expected output: Session object with finalSelection object
  test('should create a session with finalSelection', () => {
    // Arrange
    const restaurantId = new mongoose.Types.ObjectId();
    const selectedAt = new Date();
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      finalSelection: {
        restaurantId: restaurantId,
        selectedAt: selectedAt
      },
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Act
    const session = new Session(sessionData);

    // Assert
    expect(session).toBeDefined();
    expect(session.finalSelection).toBeDefined();
    // Add non-null assertion to handle TypeScript undefined warning
    expect(session.finalSelection!.restaurantId.toString()).toBe(restaurantId.toString());
    expect(session.finalSelection!.selectedAt).toEqual(selectedAt);
  });

  // Input: Valid session data with custom status
  // Expected behavior: Session is created with specified status
  // Expected output: Session object with status matching input
  test('should create a session with custom status', () => {
    // Arrange
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      status: 'MATCHING',
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Act
    const session = new Session(sessionData);

    // Assert
    expect(session).toBeDefined();
    expect(session.status).toBe('MATCHING');
  });

  // Input: Valid session data with invalid status
  // Expected behavior: Validation error is thrown
  // Expected output: Error message indicating invalid status
  test('should throw validation error for invalid status', () => {
    // Arrange
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      status: 'INVALID_STATUS',
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Act & Assert
    const session = new Session(sessionData as any);
    const validationError = session.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError?.errors).toBeDefined();
    expect(validationError?.errors.status).toBeDefined();
  });
});
