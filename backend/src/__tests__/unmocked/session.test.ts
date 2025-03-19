import mongoose from 'mongoose';
import { SessionManager } from '../../services/sessionManager';
import { RestaurantService } from '../../services/restaurantService';
import { UserService } from '../../services/userService';

// Mock all the services
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

interface CustomError extends Error {
  code?: string;
}

jest.unmock('../../services/sessionManager');
jest.unmock('../../services/restaurantService');  
jest.unmock('../../services/userService');  

jest.mock('../../models/session', () => {
  const SessionModel = jest.fn().mockImplementation(function (this: any, data) {
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
          participants: [{ userId: { equals: (id: any) => id === 'userId1' } }],
          pendingInvitations: [{ equals: (id: any) => id === 'invitedUserId' }]
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
          save: jest.fn().mockResolvedValue({}) as jest.Mock<Promise<{}>>
        });
      }
      
      return Promise.resolve({
        _id: id,
        status: 'MATCHING',
        creator: { equals: (userId: any) => userId === 'creatorId' },
        participants: [
          { 
            userId: { equals: (userId: any) => userId === 'userId1' || userId === 'creatorId' },
            preferences: []
          }
        ],
        restaurants: [{ restaurantId: { toString: () => 'restaurant1' }, positiveVotes: 0, totalVotes: 0, score: 0 }],
        doneSwiping: [{ equals: (userId: any) => userId === 'userId1' }],
        save: jest.fn().mockResolvedValue({})
      });
    }),
    
    findOneAndUpdate: jest.fn().mockImplementation((query, update, options) => {
      // Mock for sessionSwiped
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
      if (query.pendingInvitations && query.pendingInvitations.$ne) {
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
    
    find: jest.fn().mockImplementation((query) => {
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
    
    findByIdAndUpdate: jest.fn().mockImplementation((id, update, options) => {
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


describe('SessionManager', () => {
  let restaurantService: RestaurantService;
  let sessionManager: SessionManager;
  let userService: UserService;

  beforeEach(() => {
    restaurantService = new RestaurantService();
    sessionManager = new SessionManager(restaurantService);
    userService = new UserService();
  });

  describe('Session Swiped Test', () => {
    // test('should successfully record a user swipe on a restaurant', async () => {
    //   // Setup
    //   const sessionId = 'valid-session-id';
    //   const userId = 'userId1';
    //   const restaurantId = 'new-restaurant-id';
    //   const swipe = true;
      
    //   // Mock the findOneAndUpdate to return a successful result
    //   const mockSession = {
    //     _id: sessionId,
    //     status: 'MATCHING',
    //     participants: [
    //       {
    //         userId: userId,
    //         preferences: [
    //           {
    //             restaurantId: restaurantId,
    //             liked: swipe,
    //             timestamp: expect.any(Date)
    //           }
    //         ]
    //       }
    //     ]
    //   };
      
    //   jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
    //     .mockResolvedValueOnce(mockSession);
      
    //   // Execute
    //   const result = await sessionManager.sessionSwiped(sessionId, userId, restaurantId, swipe);
      
    //   // Assert
    //   expect(result).toEqual(mockSession);
    //   expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
    //     {
    //       _id: expect.anything(),
    //       status: { $eq: 'MATCHING' },
    //       'participants.userId': expect.anything(),
    //       'participants': {
    //         $not: {
    //           $elemMatch: {
    //             userId: expect.anything(),
    //             'preferences.restaurantId': restaurantId
    //           }
    //         }
    //       }
    //     },
    //     {
    //       $push: {
    //         'participants.$.preferences': {
    //           restaurantId: restaurantId,
    //           liked: swipe,
    //           timestamp: expect.any(Date)
    //         }
    //       }
    //     },
    //     { new: true, runValidators: true }
    //   );
    // });
    test('should successfully record a user swipe on a restaurant', async () => {
      // Setup
      const sessionId = 'valid-session-id';
      const userId = 'userId1';
      const restaurantId = 'new-restaurant-id';
      const swipe = true;
      
      // Mock the findOneAndUpdate to return a successful result
      const mockSession = {
        _id: sessionId,
        status: 'MATCHING',
        participants: [
          {
            userId: userId,
            preferences: [
              {
                restaurantId: restaurantId,
                liked: swipe,
                timestamp: expect.any(Date)
              }
            ]
          }
        ]
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(mockSession);
      
      // Execute
      const result = await sessionManager.sessionSwiped(sessionId, userId, restaurantId, swipe);
      
      // Assert
      expect(result).toEqual(mockSession);
      expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: { str: "valid-session-id" },
          status: { $eq: 'MATCHING' },
          'participants.userId': { str: "userId1" },
          'participants': {
            $not: {
              $elemMatch: {
                userId: { str: "userId1" },
                'preferences.restaurantId': { str: "new-restaurant-id" }
              }
            }
          }
        },
        {
          $push: {
            'participants.$.preferences': {
              restaurantId: { str: "new-restaurant-id" },
              liked: swipe,
              timestamp: expect.any(Date)
            }
          }
        },
        { new: true, runValidators: true }
      );
    });
  
    test('should throw error when trying to swipe on a restaurant the user already swiped on', async () => {
      // Setup
      const sessionId = 'valid-session-id';
      const userId = 'userId1';
      const restaurantId = 'restaurant1'; // restaurant already swiped on
      const swipe = true;
      
      // Mock findOneAndUpdate to return null (no update performed)
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Mock findOne to find the existing swipe
      const existingSession = {
        _id: sessionId,
        participants: [
          {
            userId: userId,
            preferences: [{ restaurantId: restaurantId }]
          }
        ]
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce(existingSession);
      
      // Execute & Assert
      await expect(sessionManager.sessionSwiped(sessionId, userId, restaurantId, swipe))
        .rejects.toThrow('User already swiped on this restaurant');
    });
  
    test('should throw error when session does not exist or user not in session', async () => {
      // Setup
      const sessionId = 'nonexistent-session';
      const userId = 'userId1';
      const restaurantId = 'restaurant1';
      const swipe = true;
      
      // Mock findOneAndUpdate to return null (session not found)
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Mock findOne to return null (session not found)
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(sessionManager.sessionSwiped(sessionId, userId, restaurantId, swipe))
        .rejects.toThrow('Session does not exist or already completed or user not in session');
    });
  
    test('should throw error when session is not in MATCHING status', async () => {
      // Setup
      const sessionId = 'completed-session';
      const userId = 'userId1';
      const restaurantId = 'restaurant1';
      const swipe = false;
      
      // Mock findOneAndUpdate to return null (no update because session not in MATCHING status)
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Mock findOne to return a session that's not in MATCHING status
      const existingSession = {
        _id: sessionId,
        status: 'COMPLETED',
        participants: [
          {
            userId: userId,
            preferences: []
          }
        ]
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(sessionManager.sessionSwiped(sessionId, userId, restaurantId, swipe))
        .rejects.toThrow('Session does not exist or already completed or user not in session');
    });

    test('should handle negative swipe (dislike) properly', async () => {
      // Setup
      const sessionId = 'valid-session-id';
      const userId = 'userId1';
      const restaurantId = 'new-restaurant-id';
      const swipe = false; // Dislike
      
      // Mock the findOneAndUpdate to return a successful result with dislike
      const mockSession = {
        _id: sessionId,
        status: 'MATCHING',
        participants: [
          {
            userId: userId,
            preferences: [
              {
                restaurantId: restaurantId,
                liked: false,
                timestamp: expect.any(Date)
              }
            ]
          }
        ]
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(mockSession);
      
      // Execute
      const result = await sessionManager.sessionSwiped(sessionId, userId, restaurantId, swipe);
      
      // Assert
      expect(result).toEqual(mockSession);
      expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: { str: "valid-session-id" },
          status: { $eq: 'MATCHING' },
          'participants.userId': { str: "userId1" },
          'participants': {
            $not: {
              $elemMatch: {
                userId: { str: "userId1" },
                'preferences.restaurantId': { str: "new-restaurant-id" }
              }
            }
          }
        },
        {
          $push: {
            'participants.$.preferences': {
              restaurantId: { str: "new-restaurant-id" },
              liked: false,
              timestamp: expect.any(Date)
            }
          }
        },
        { new: true, runValidators: true }
      );
    });
  
    // test('should handle negative swipe (dislike) properly', async () => {
    //   // Setup
    //   const sessionId = 'valid-session-id';
    //   const userId = 'userId1';
    //   const restaurantId = 'new-restaurant-id';
    //   const swipe = false; // Dislike
      
    //   // Mock the findOneAndUpdate to return a successful result with dislike
    //   const mockSession = {
    //     _id: sessionId,
    //     status: 'MATCHING',
    //     participants: [
    //       {
    //         userId: userId,
    //         preferences: [
    //           {
    //             restaurantId: restaurantId,
    //             liked: false,
    //             timestamp: expect.any(Date)
    //           }
    //         ]
    //       }
    //     ]
    //   };
      
    //   jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
    //     .mockResolvedValueOnce(mockSession);
      
    //   // Execute
    //   const result = await sessionManager.sessionSwiped(sessionId, userId, restaurantId, swipe);
      
    //   // Assert
    //   expect(result).toEqual(mockSession);
    //   expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
    //     expect.anything(),
    //     {
    //       $push: {
    //         'participants.$.preferences': {
    //           restaurantId: restaurantId,
    //           liked: false,
    //           timestamp: expect.any(Date)
    //         }
    //       }
    //     },
    //     expect.anything()
    //   );
    // });
  });

  describe('addPendingInvitation', () => {
    test('should successfully add a pending invitation to a session', async () => {
      // Arrange
      const sessionId = 'validSessionId';
      const userId = 'newUserId';
      
      // Act
      const result = await sessionManager.addPendingInvitation(sessionId, userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.anything(),
          status: { $ne: 'COMPLETED' },
          'participants.userId': { $ne: expect.anything() },
          pendingInvitations: { $ne: expect.anything() }
        },
        {
          $push: { 
            pendingInvitations: expect.anything(),
            doneSwiping: expect.anything()
          }
        },
        { new: true, runValidators: true }
      );
    });
  
    test('should throw error when session does not exist', async () => {
      // Arrange
      const sessionId = 'nonexistentId';
      const userId = 'newUserId';
      
      // Mock findById to return null for the session lookup in error handling
      require('../../models/session').Session.findById.mockResolvedValueOnce(null);
      require('../../models/session').Session.findOneAndUpdate.mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(sessionManager.addPendingInvitation(sessionId, userId))
        .rejects.toThrow('Session not found');
    });
  
    test('should throw error when trying to invite to a completed session', async () => {
      // Arrange
      const sessionId = 'completedSessionId';
      const userId = 'newUserId';
      
      // Mock findOneAndUpdate to return null (failure)
      require('../../models/session').Session.findOneAndUpdate.mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(sessionManager.addPendingInvitation(sessionId, userId))
        .rejects.toThrow('Cannot invite users to a completed session');
    });
  
    test('should throw error when user is already a participant', async () => {
      // Arrange
      const sessionId = 'validSessionId';
      const userId = 'userId1'; // This user is already a participant in our mocks
      
      // Mock findOneAndUpdate to return null (failure)
      require('../../models/session').Session.findOneAndUpdate.mockResolvedValueOnce(null);
      
      // Mock findById to return a session with the user as participant
      require('../../models/session').Session.findById.mockResolvedValueOnce({
        _id: sessionId,
        status: 'CREATED',
        participants: [{ userId: { equals: (id: any) => id === userId } }],
        pendingInvitations: []
      });
      
      // Act & Assert
      await expect(sessionManager.addPendingInvitation(sessionId, userId))
        .rejects.toThrow('Failed to invite user to session');
    });
  
    test('should throw error when user has already been invited', async () => {
      // Arrange
      const sessionId = 'validSessionId';
      const userId = 'invitedUserId'; // This user is already invited in our mocks
      
      // Mock findOneAndUpdate to return null (failure)
      require('../../models/session').Session.findOneAndUpdate.mockResolvedValueOnce(null);
      
      // Mock findById to return a session with the user already invited
      require('../../models/session').Session.findById.mockResolvedValueOnce({
        _id: sessionId,
        status: 'CREATED',
        participants: [],
        pendingInvitations: [{ equals: (id: any) => id === userId }]
      });
      
      // Act & Assert
      await expect(sessionManager.addPendingInvitation(sessionId, userId))
        .rejects.toThrow('Failed to invite user to session');
    });
  
    test('should throw error for invalid ID format', async () => {
      // Arrange
      // Override the isValid method for this test only
      const originalIsValid = mongoose.Types.ObjectId.isValid;
      mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);
      
      const sessionId = 'invalid-format';
      const userId = 'valid-id';
      
      // Act & Assert
      await expect(sessionManager.addPendingInvitation(sessionId, userId))
        .rejects.toThrow('Invalid ID format');
      
      // Restore original method
      mongoose.Types.ObjectId.isValid = originalIsValid;
    });
  });

  // ...existing code...

  describe('Get Restaurant Result', () => {
    // test('should return winning restaurant when session is completed', async () => {
    //   // Setup
    //   const sessionId = 'completedSessionId';
    //   const mockWinnerRestaurant = {
    //     _id: 'restaurant1',
    //     name: 'Test Restaurant',
    //     location: { lat: 49.2, lng: -123.1 },
    //     rating: 4.5
    //   };
      
    //   // Mock the getRestaurant method
    //   jest.spyOn(restaurantService, 'getRestaurant').mockResolvedValue(mockWinnerRestaurant as any);
      
    //   // Execute
    //   const result = await sessionManager.getResultForSession(sessionId);
      
    //   // Assert
    //   expect(result).toEqual(mockWinnerRestaurant);
    //   expect(restaurantService.getRestaurant).toHaveBeenCalled();
    // });
    
    test('should throw error when session is not found', async () => {
      // Execute & Assert
      await expect(sessionManager.getResultForSession('nonexistentId'))
        .rejects.toThrow('Session not found');
    });
    
    test('should throw error when session is not completed', async () => {
      // Setup - Override the mock specifically for this test
      const sessionId = 'activeSessionId';
      require('../../models/session').Session.findById.mockResolvedValueOnce({
        _id: sessionId,
        status: 'MATCHING',
        doneSwiping: ['userId1'], // Not empty, so not everyone is done swiping
        participants: []
      });
      
      // Execute & Assert
      await expect(sessionManager.getResultForSession(sessionId))
        .rejects.toThrow('Session is not completed');
    });
    
    test('should mark session as completed and calculate winner when all users are done', async () => {
      // Setup
      const sessionId = 'matchingSessionDoneId';
      const mockSession = {
        _id: sessionId,
        status: 'MATCHING',
        doneSwiping: [], // Empty, everyone is done
        participants: [
          { 
            userId: 'user1',
            preferences: [
              { restaurantId: 'restaurant1', liked: true },
              { restaurantId: 'restaurant2', liked: false }
            ]
          },
          {
            userId: 'user2',
            preferences: [
              { restaurantId: 'restaurant1', liked: true },
              { restaurantId: 'restaurant2', liked: true }
            ]
          }
        ],
        restaurants: [
          { restaurantId: { toString: () => 'restaurant1' }, positiveVotes: 0, totalVotes: 0, score: 0 },
          { restaurantId: { toString: () => 'restaurant2' }, positiveVotes: 0, totalVotes: 0, score: 0 }
        ],
        save: jest.fn().mockResolvedValue({})
      };
      
      require('../../models/session').Session.findById.mockResolvedValueOnce(mockSession);
      
      const mockWinnerRestaurant = {
        _id: 'restaurant1',
        name: 'Winning Restaurant',
        location: { lat: 49.2, lng: -123.1 },
        rating: 4.5
      };
      
      jest.spyOn(restaurantService, 'getRestaurant').mockResolvedValue(mockWinnerRestaurant as any);
      
      // Execute
      const result = await sessionManager.getResultForSession(sessionId);
      
      // Assert
      expect(result).toEqual(mockWinnerRestaurant);
      expect(mockSession.save).toHaveBeenCalled();
      expect(mockSession.status).toBe('COMPLETED');
      // expect(mockSession.finalSelection as any).toBeDefined();
      // expect(mockSession.finalSelection.restaurantId.toString()).toBe('restaurant1');
    });
  });

  describe('Join Session', () => {
    test('should allow user to join session with valid join code', async () => {
      // Setup
      const joinCode = 'VALID';
      const userId = 'invitedUserId';
      
      const mockSession = {
        _id: 'sessionId',
        joinCode,
        status: 'CREATED',
        participants: [{ userId: 'creatorId' }],
        pendingInvitations: [{ equals: (id: any) => id === userId }]
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(mockSession);
      
      // Execute
      const result = await sessionManager.joinSession(joinCode, userId);
      
      // Assert
      expect(result).toEqual(mockSession);
      expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
        {
          joinCode,
          status: { $ne: 'COMPLETED' },
          pendingInvitations: expect.anything(),
          'participants.userId': { $ne: expect.anything() }
        },
        {
          $pull: { pendingInvitations: expect.anything() },
          $push: {
            participants: {
              userId: expect.anything(),
              preferences: []
            }
          }
        },
        { new: true, runValidators: true }
      );
    });
    
    test('should throw error when session not found', async () => {
      // Setup
      const joinCode = 'INVALID';
      const userId = 'userId';
      
      // Mock findOneAndUpdate to return null
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Mock findOne to return null
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(sessionManager.joinSession(joinCode, userId))
        .rejects.toThrow('Session not found');
    });
    
    test('should throw error when session is completed', async () => {
      // Setup
      const joinCode = 'COMPLETED';
      const userId = 'userId';
      
      // Mock findOneAndUpdate to return null
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Mock findOne to return a completed session
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce({
          status: 'COMPLETED'
        });
      
      // Execute & Assert
      await expect(sessionManager.joinSession(joinCode, userId))
        .rejects.toThrow('Cannot join a completed session');
    });
    
    test('should throw error when user already a participant', async () => {
      // Setup
      const joinCode = 'VALID';
      const userId = 'existingUserId';
      
      // Mock findOneAndUpdate to return null
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Mock findOne to return a session where user is already participant
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce({
          status: 'CREATED',
          participants: [{ userId: { equals: (id: any) => id === userId } }]
        });
      
      // Execute & Assert
      await expect(sessionManager.joinSession(joinCode, userId))
        .rejects.toThrow('User has not been invited to this session');
    });
    
    test('should throw error when user not invited', async () => {
      // Setup
      const joinCode = 'VALID';
      const userId = 'uninvitedUserId';
      
      // Mock findOneAndUpdate to return null
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Mock findOne to return a session where user is not invited
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce({
          status: 'CREATED',
          participants: [],
          pendingInvitations: []
        });
      
      // Execute & Assert
      await expect(sessionManager.joinSession(joinCode, userId))
        .rejects.toThrow('User has not been invited to this session');
    });
  });

  describe('Start Session', () => {
    test('should start session successfully', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const creatorId = 'creatorId';
      const time = 5;
      
      const mockSession = {
        _id: sessionId,
        status: 'MATCHING'
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(mockSession);
      
      // Mock setTimeout
      jest.useFakeTimers();
      
      // Execute
      const result = await sessionManager.startSession(sessionId, creatorId, time);
      
      // Assert
      expect(result).toEqual(mockSession);
      expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.anything(),
          creator: expect.anything(),
          status: 'CREATED'
        },
        {
          status: 'MATCHING'
        },
        { new: true, runValidators: true }
      );
      
      // Reset timers
      jest.useRealTimers();
    });
    
    test('should throw error when session not found or user not creator', async () => {
      // Setup
      const sessionId = 'invalidSessionId';
      const userId = 'nonCreatorId';
      const time = 5;
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(sessionManager.startSession(sessionId, userId, time))
        .rejects.toThrow('Session does not exists or user is not the creator or session does not have created status');
    });
  });

  describe('User Done Swiping', () => {
    test('should mark user as done swiping', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const userId = 'userId1';
      
      const mockSession = {
        _id: sessionId,
        status: 'MATCHING',
        doneSwiping: [],
        save: jest.fn().mockResolvedValue({})
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(mockSession);
      
      // Execute
      const result = await sessionManager.userDoneSwiping(sessionId, userId);
      
      // Assert
      expect(result).toEqual(mockSession);
      expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.anything(),
          status: 'MATCHING',
          'participants.userId': expect.anything(),
        },
        {
          $pull: { doneSwiping: expect.anything() }
        },
        { new: true, runValidators: true }
      );
    });
    
    test('should complete session when all users are done swiping', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const userId = 'lastUserId';
      
      const mockSession = {
        _id: sessionId,
        status: 'MATCHING',
        doneSwiping: [], // empty after the last user is removed
        save: jest.fn().mockResolvedValue({})
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(mockSession);
      
      // Execute
      const result = await sessionManager.userDoneSwiping(sessionId, userId);
      
      // Assert
      expect(result.status).toBe('COMPLETED');
      expect(mockSession.save).toHaveBeenCalled();
    });
    
    test('should throw error when session not found or user not in session', async () => {
      // Setup
      const sessionId = 'invalidSessionId';
      const userId = 'nonParticipantId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(sessionManager.userDoneSwiping(sessionId, userId))
        .rejects.toThrow('Session does not exists or user is not in session or user has already swiped');
    });
  });
    
  describe('Get Restaurant In Session', () => {
    test('should return restaurants in session', async () => {
      // Setup
      const sessionId = 'validSessionId';
      
      const mockSession = {
        _id: sessionId,
        restaurants: [
          { restaurantId: 'restaurant1' },
          { restaurantId: 'restaurant2' }
        ]
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce(mockSession);
      
      const mockRestaurants = [
        {
          _id: 'restaurant1',
          name: 'Restaurant 1',
          location: { lat: 49.2, lng: -123.1 }
        },
        {
          _id: 'restaurant2',
          name: 'Restaurant 2',
          location: { lat: 49.3, lng: -123.2 }
        }
      ];
      
      jest.spyOn(restaurantService, 'getRestaurants')
        .mockResolvedValueOnce(mockRestaurants as any);
      
      // Execute
      const result = await sessionManager.getRestaurantsInSession(sessionId);
      
      // Assert
      expect(result).toEqual(mockRestaurants);
      expect(restaurantService.getRestaurants).toHaveBeenCalledWith(['restaurant1', 'restaurant2']);
    });
    
    test('should throw error when session not found', async () => {
      // Setup
      const sessionId = 'nonexistentId';
      
      jest.spyOn(require('../../models/session').Session, 'findOne')
        .mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(sessionManager.getRestaurantsInSession(sessionId))
        .rejects.toThrow('Session not found');
    });
  });

  describe('Leave Session', () => {
    test('should allow participant to leave session', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const userId = 'participantId';
      
      const mockUpdatedSession = {
        _id: sessionId,
        participants: []
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(mockUpdatedSession);
      
      // Execute
      const result = await sessionManager.leaveSession(sessionId, userId);
      
      // Assert
      expect(result).toEqual(mockUpdatedSession);
      expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.anything(),
          status: { $ne: 'COMPLETED' },
          creator: { $ne: expect.anything() },
          'participants.userId': expect.anything()
        },
        {
          $pull: { participants: { userId: expect.anything() } }
        },
        { new: true, runValidators: true }
      );
    });
    
    test('should throw error when session not found', async () => {
      // Setup
      const sessionId = 'nonexistentId';
      const userId = 'userId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      jest.spyOn(require('../../models/session').Session, 'findById')
        .mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(sessionManager.leaveSession(sessionId, userId))
        .rejects.toThrow('Session not found');
    });
    
    test('should throw error when session is completed', async () => {
      // Setup
      const sessionId = 'completedSessionId';
      const userId = 'userId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      jest.spyOn(require('../../models/session').Session, 'findById')
        .mockResolvedValueOnce({ status: 'COMPLETED' });
      
      // Execute & Assert
      await expect(sessionManager.leaveSession(sessionId, userId))
        .rejects.toThrow('Cannot leave a completed session');
    });
    
    test('should throw error when user is session creator', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const creatorId = 'creatorId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      jest.spyOn(require('../../models/session').Session, 'findById')
        .mockResolvedValueOnce({ 
          status: 'MATCHING',
          creator: { equals: (id: any) => id === creatorId }
        });
      
      // Execute & Assert
      await expect(sessionManager.leaveSession(sessionId, creatorId))
        .rejects.toThrow('User is not a participant in this session');
    });
    
    test('should throw error when user not in session', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const userId = 'nonParticipantId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      jest.spyOn(require('../../models/session').Session, 'findById')
        .mockResolvedValueOnce({
        status: 'MATCHING',
        creator: { equals: () => false },
        participants: []
      });
      
      // Execute & Assert
      await expect(sessionManager.leaveSession(sessionId, userId))
        .rejects.toThrow('User is not a participant in this session');
    });
  });

  describe('Reject Invitation', () => {
    test('should allow user to reject invitation', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const userId = 'invitedUserId';
      
      const mockUpdatedSession = {
        _id: sessionId,
        pendingInvitations: []
      };
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(mockUpdatedSession);
      
      // Execute
      const result = await sessionManager.rejectInvitation(sessionId, userId);
      
      // Assert
      expect(result).toEqual(mockUpdatedSession);
      expect(require('../../models/session').Session.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.anything(),
          status: { $ne: 'COMPLETED' },
          pendingInvitations: expect.anything(),
          'participants.userId': { $ne: expect.anything() }
        },
        {
          $pull: { pendingInvitations: expect.anything() }
        },
        { new: true, runValidators: true }
      );
    });
    
    test('should throw error when session not found', async () => {
      // Setup
      const sessionId = 'nonexistentId';
      const userId = 'userId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      jest.spyOn(require('../../models/session').Session, 'findById')
        .mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(sessionManager.rejectInvitation(sessionId, userId))
        .rejects.toThrow('Session not found');
    });
    
    test('should throw error when session is completed', async () => {
      // Setup
      const sessionId = 'completedSessionId';
      const userId = 'userId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      jest.spyOn(require('../../models/session').Session, 'findById')
        .mockResolvedValueOnce({ status: 'COMPLETED' });
      
      // Execute & Assert
      await expect(sessionManager.rejectInvitation(sessionId, userId))
        .rejects.toThrow('Cannot reject invitation for a completed session');
    });
    
    test('should throw error when user is already a participant', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const userId = 'participantId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      jest.spyOn(require('../../models/session').Session, 'findById')
        .mockResolvedValueOnce({
        status: 'MATCHING',
        participants: [{ userId: { equals: (id: any) => id === userId } }]
      });
      
      // Execute & Assert
      await expect(sessionManager.rejectInvitation(sessionId, userId))
        .rejects.toThrow('User has not been invited to this session');
    });
    
    test('should throw error when user not invited', async () => {
      // Setup
      const sessionId = 'validSessionId';
      const userId = 'nonInvitedId';
      
      jest.spyOn(require('../../models/session').Session, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);
      
      jest.spyOn(require('../../models/session').Session, 'findById')
        .mockResolvedValueOnce({
        status: 'MATCHING',
        participants: [],
        pendingInvitations: []
      });
      
      // Execute & Assert
      await expect(sessionManager.rejectInvitation(sessionId, userId))
        .rejects.toThrow('User has not been invited to this session');
    });
  });

  describe('Get User Sessions', () => {
    test('should return sessions for a user', async () => {
      // Setup
      const userId = 'validUserId';
      const mockSessions = [
        {
          _id: 'session1',
          creator: 'validUserId',
          participants: [],
          status: 'CREATED'
        },
        {
          _id: 'session2',
          creator: 'otherUser',
          participants: [{ userId: 'validUserId' }],
          status: 'MATCHING'
        }
      ];
      
      jest.spyOn(require('../../models/session').Session, 'find')
        .mockReturnValueOnce({
          sort: jest.fn().mockResolvedValueOnce(mockSessions)
        });
      
      // Execute
      const result = await sessionManager.getUserSessions(userId);
      
      // Assert
      expect(result).toEqual(mockSessions);
      expect(require('../../models/session').Session.find).toHaveBeenCalledWith({
        $or: [
          { creator: expect.anything() },
          { 'participants.userId': expect.anything() },
          { pendingInvitations: expect.anything() }
        ],
        status: { $ne: 'COMPLETED' }
      });
    });
    
    test('should throw error for invalid user ID', async () => {
      // Setup - Override the isValid method for this test
      const originalIsValid = mongoose.Types.ObjectId.isValid;
      mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValueOnce(false);
      
      // Execute & Assert
      await expect(sessionManager.getUserSessions('invalid-id'))
        .rejects.toThrow('Invalid user ID format');
      
      // Restore original method
      mongoose.Types.ObjectId.isValid = originalIsValid;
    });
    
    test('should handle empty result when user has no sessions', async () => {
      // Setup
      const userId = 'userWithNoSessions';
      
      jest.spyOn(require('../../models/session').Session, 'find')
        .mockReturnValueOnce({
          sort: jest.fn().mockResolvedValueOnce([])
        });
      
      // Execute
      const result = await sessionManager.getUserSessions(userId);
      
      // Assert
      expect(result).toEqual([]);
    });
  });

});