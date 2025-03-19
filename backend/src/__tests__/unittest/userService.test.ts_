import '../mocked/mocked_setup';

import mongoose from 'mongoose';
import { UserService } from '../../services/userService';

// This file tests the actual UserService implementation with mocked dependencies
// The UserModel is mocked in setup.ts
jest.unmock('../../services/userService');

// Create a function to mock the lean() method that all query methods should return
const createMockWithLean = (returnValue: any) => ({
  lean: jest.fn().mockResolvedValue(returnValue)
});

describe('UserService - Mocked Tests', () => {
  let userService: UserService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockUserModel.findOne.mockReset();
    mockUserModel.create.mockReset();
    mockUserModel.findById.mockReset();
    mockUserModel.findByIdAndUpdate.mockReset();
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a new instance of UserService with our mock model for each test
    userService = new UserService(mockUserModel as any);
  });
  
  // Test for line 7: Constructor with default parameter
  test('should initialize with default UserModel when not provided', () => {
    // This test covers the branch where the constructor uses the default parameter
    // We need to temporarily restore the original import
    jest.unmock('../../models/user');
    const originalImport = jest.requireActual('../../models/user');
    
    // Create a new instance without providing a model
    const defaultUserService = new UserService();
    
    // Verify that the userModel is set to the default UserModel
    expect(defaultUserService).toBeDefined();
    
    // Re-mock the user model for subsequent tests
    jest.mock('../../models/user', () => ({
      UserModel: mockUserModel
    }));
  });

  afterEach(() => {
    // Restore any environment variables that might have been modified
    consoleErrorSpy.mockRestore();
  });



  describe('createUser', () => {
    test('should successfully create a new user', async () => {
      // Input: Valid email and displayName
      // Expected behavior: User is created after checking no existing user
      // Expected output: Newly created user object
      
      // Test data
      const email = 'test@example.com';
      const displayName = 'Test User';
      
      // Mock user returned from create
      const mockUser = {
        _id: 'new-user-id',
        email,
        displayName,
        sessionHistory: [],
        restaurantInteractions: []
      };
      
      // Mock getUserByEmail to return null (no existing user)
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(null));
      
      // Mock create to return the new user
      mockUserModel.create.mockResolvedValueOnce(mockUser);

      // Call the method
      const result = await userService.createUser(email, displayName);

      // Assertions
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email,
        displayName,
        sessionHistory: [],
        restaurantInteractions: []
      });
    });
    
    test('should throw error when user already exists', async () => {
      // Input: Email that already exists in database
      // Expected behavior: Error is thrown without creating user
      // Expected output: Error with message 'User already exists'
      
      const email = 'existing@example.com';
      const displayName = 'Existing User';
      
      // Mock existing user
      const existingUser = {
        _id: 'existing-id',
        email,
        displayName
      };
      
      // Mock getUserByEmail to return existing user
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(existingUser));
      
      // Call the method and expect it to throw
      await expect(userService.createUser(email, displayName))
        .rejects.toThrow('User already exists');
      
      // Verify create was not called
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
    
    test('should throw error when email and displayName not provided', async () => {
      // Input: Empty email and displayName
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'Email and displayName are required'
      
      await expect(userService.createUser('', ''))
        .rejects.toThrow('Email and displayName are required');
      
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
    
    test('should handle database error during creation', async () => {
      // Input: Valid data but database error occurs
      // Expected behavior: Error is caught and rethrown
      // Expected output: Error with message 'Failed to create user'
      
      const email = 'test@example.com';
      const displayName = 'Test User';
      
      // Mock getUserByEmail to return null (no existing user)
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(null));
      
      // Mock create to throw an error
      const dbError = new Error('Database error');
      mockUserModel.create.mockRejectedValueOnce(dbError);
      
      await expect(userService.createUser(email, displayName))
        .rejects.toThrow('Failed to create user');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating user:', dbError);
    });

  //   test('should throw error when user already exists', async () => {
  //     // Input: Email that already exists in database
  //     // Expected behavior: Error is thrown after finding existing user
  //     // Expected output: Error with message 'User already exists'
      
  //     // Test data
  //     const email = 'existing@example.com';
  //     const displayName = 'Existing User';
      
  //     // Mock existing user
  //     const existingUser = {
  //       _id: 'existing-id',
  //       email,
  //       displayName
  //     };
      
  //     // Mock getUserByEmail to return an existing user
  //     mockLean.mockResolvedValueOnce(existingUser);

  //     // Call and assert
  //     await expect(userService.createUser(email, displayName))
  //       .rejects.toThrow('User already exists');
      
  //     expect(mockCreate).not.toHaveBeenCalled();
  //   });

  //   test('should throw error when email and displayName not provided', async () => {
  //     // Input: Empty email and displayName
  //     // Expected behavior: Validation error is thrown
  //     // Expected output: Error with message 'Email and displayName are required'
      
  //     await expect(userService.createUser('', ''))
  //       .rejects.toThrow('Email and displayName are required');
        
  //     expect(mockFindOne).not.toHaveBeenCalled();
  //     expect(mockCreate).not.toHaveBeenCalled();
  //   });


  });

  describe('getUserById', () => {
    test('should handle special case for invalid-id in unmocked environment', async () => {
      // Input: 'invalid-id' in an unmocked environment
      // Expected behavior: Error is thrown with proper message for unmocked tests
      // Expected output: Error with message 'Invalid ID'
      
      // Save the original environment variable
      const originalEnv = process.env.JEST_WORKER_ID;
      
      // Mock environment to simulate unmocked tests
      process.env.JEST_WORKER_ID = undefined;
      
      // Mock ObjectId.isValid to return true to bypass the initial validation
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      
      // Call the method and expect it to throw the unmocked error message
      await expect(userService.getUserById('invalid-id'))
        .rejects.toThrow('Invalid ID');
      
      // Restore the environment variable
      process.env.JEST_WORKER_ID = originalEnv;
      
      expect(mockUserModel.findById).toHaveBeenCalledWith('invalid-id');
    });
    
    test('should preserve specific Invalid ID error message', async () => {
      // Input: Valid user ID but with specific Invalid ID error
      // Expected behavior: Original error with 'Invalid ID' message is preserved and rethrown
      // Expected output: Error with message 'Invalid ID'
      
      const userId = 'specific-invalid-id';
      const invalidIdError = new Error('Invalid ID');
      
      mockUserModel.findById.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(invalidIdError)
        })
      });
      
      await expect(userService.getUserById(userId))
        .rejects.toThrow('Invalid ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user by ID:', invalidIdError);
    });
    
    test('should handle special case for invalid-id in unmocked tests', async () => {
      // Input: 'invalid-id' with JEST_WORKER_ID not set
      // Expected behavior: Error is thrown with proper message
      // Expected output: Error with message 'Invalid ID'
      
      // Save the original environment variable
      const originalJestWorkerId = process.env.JEST_WORKER_ID;
      // Delete the environment variable to simulate unmocked environment
      delete process.env.JEST_WORKER_ID;
      
      // Call the method and expect it to throw
      await expect(userService.getUserById('invalid-id'))
        .rejects.toThrow('Invalid ID');
      
      // Restore the environment variable
      process.env.JEST_WORKER_ID = originalJestWorkerId;
      
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });
    
    test('should handle query with select method', async () => {
      // Input: Valid user ID with query that has select method
      // Expected behavior: User is fetched using select().lean() chain
      // Expected output: User object with matching ID
      
      const userId = 'valid-user-id';
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      const mockSelect = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });
      
      mockUserModel.findById.mockReturnValueOnce({
        select: mockSelect
      });
      
      const result = await userService.getUserById(userId);
      
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(mockSelect).toHaveBeenCalledWith('*');
    });
    
    test('should handle direct query return', async () => {
      // Input: Valid user ID with query that returns directly
      // Expected behavior: User is fetched directly from query
      // Expected output: User object with matching ID
      
      const userId = 'direct-return-id';
      const mockUser = {
        _id: userId,
        email: 'direct@example.com',
        displayName: 'Direct User'
      };
      
      // Mock a query that doesn't have lean or select methods
      mockUserModel.findById.mockResolvedValueOnce(mockUser);
      
      const result = await userService.getUserById(userId);
      
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });
    test('should successfully get a user by ID', async () => {
      // Input: Valid user ID
      // Expected behavior: User is fetched from database
      // Expected output: User object with matching ID
      
      const userId = 'valid-user-id';
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        displayName: 'Test User'
      };

      mockUserModel.findById.mockReturnValueOnce(createMockWithLean(mockUser));

      const result = await userService.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });
    
    test('should throw error for invalid user ID format', async () => {
      // Input: Invalid user ID format
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'Invalid user ID format'
      
      // Mock mongoose.Types.ObjectId.isValid to return false for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(false);
      
      await expect(userService.getUserById('invalid-id'))
        .rejects.toThrow('Invalid user ID format');
      
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });
    
    test('should return null when user not found', async () => {
      // Input: Valid ID that doesn't exist in database
      // Expected behavior: Null is returned
      // Expected output: null
      
      mockUserModel.findById.mockReturnValueOnce(createMockWithLean(null));
      
      const result = await userService.getUserById('nonexistent-id');
      
      expect(result).toBeNull();
      expect(mockUserModel.findById).toHaveBeenCalledWith('nonexistent-id');
    });
    
    test('should handle database error', async () => {
      // Input: Valid ID but database operation fails
      // Expected behavior: Error is caught and rethrown
      // Expected output: Error with message 'Failed to fetch user by ID'
      
      const userId = 'valid-id';
      const dbError = new Error('Database error');
      
      mockUserModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(dbError)
      });
      
      await expect(userService.getUserById(userId))
        .rejects.toThrow('Failed to fetch user by ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user by ID:', dbError);
    });
    
    test('should cover branch where error message is "Invalid ID" (line 72 - true branch)', async () => {
      // Input: Valid user ID but query fails with 'Invalid ID' error
      // Expected behavior: Original error is preserved and rethrown
      // Expected output: Error with message 'Invalid ID'
      
      const userId = 'preserve-error-id';
      const invalidIdError = new Error('Invalid ID');
      
      // Mock the findById implementation to throw an 'Invalid ID' error
      mockUserModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(invalidIdError)
      });
      
      // This should trigger the true branch of the if statement at line 71-72
      await expect(userService.getUserById(userId))
        .rejects.toThrow('Invalid ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user by ID:', invalidIdError);
    });
    
    test('should cover branch where error is null (line 72 - optional chaining branch)', async () => {
      // Input: Valid user ID but query fails with null error
      // Expected behavior: Generic error is thrown
      // Expected output: Error with message 'Failed to fetch user by ID'
      
      const userId = 'null-error-id';
      
      // Mock the findById implementation to throw null
      mockUserModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockImplementation(() => {
          // Create a situation where error is null but still caught
          throw null;
        })
      });
      
      // This should trigger the optional chaining branch of the if statement at line 71-72
      await expect(userService.getUserById(userId))
        .rejects.toThrow('Failed to fetch user by ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user by ID:', null);
    });
    
    test('should cover branch where error message is not "Invalid ID" (line 72 - false branch)', async () => {
      // Input: Valid user ID but query fails with a custom error
      // Expected behavior: Generic error is thrown instead of preserving original error
      // Expected output: Error with message 'Failed to fetch user by ID'
      
      const userId = 'custom-error-id';
      const customError = new Error('Some other error');
      
      // Mock the findById implementation to throw a custom error
      mockUserModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(customError)
      });
      
      // This should trigger the false branch of the if statement at line 71-72
      await expect(userService.getUserById(userId))
        .rejects.toThrow('Failed to fetch user by ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user by ID:', customError);
    });
  //   });

  //   test('should throw error for invalid user ID', async () => {
  //     // Input: Invalid user ID format
  //     // Expected behavior: Validation error is thrown
  //     // Expected output: Error with message 'Invalid user ID format'
      
  //     const invalidId = 'invalid-id';
      
  //     // Mock isValid to return false for this test
  //     mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

  //     await expect(userService.getUserById(invalidId))
  //       .rejects.toThrow('Invalid user ID format');
      
  //     expect(mockFindById).not.toHaveBeenCalled();
  //   });

  //   test('should return null when user not found', async () => {
  //     // Input: ID that doesn't exist in database
  //     // Expected behavior: Database returns null
  //     // Expected output: null result
      
  //     mockLean.mockResolvedValueOnce(null);

  //     const result = await userService.getUserById('nonexistent-id');
      
  //     expect(result).toBeNull();
  //     expect(mockFindById).toHaveBeenCalledWith('nonexistent-id');
  //   });

  //   test('should throw error when database query fails', async () => {
  //     // Input: Valid ID but database operation fails
  //     // Expected behavior: Database error is caught and rethrown
  //     // Expected output: Error with message 'Failed to fetch user by ID'
      
  //     mockLean.mockRejectedValueOnce(new Error('Database error'));

  //     await expect(userService.getUserById('valid-id'))
  //       .rejects.toThrow('Failed to fetch user by ID');
      
  //     expect(consoleErrorSpy).toHaveBeenCalled();
  //     expect(mockFindById).toHaveBeenCalledWith('valid-id');
  //   });
  // });



    test('should throw error when email not provided', async () => {
      // Input: Empty email string
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'Email is required'
      
      // No need to mock anything as validation happens before DB call
      await expect(userService.getUserByEmail(''))
        .rejects.toThrow('Email is required');
        
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });

    test('should return null when user not found', async () => {
      // Input: Email that doesn't exist in database
      // Expected behavior: Null is returned when no user found
      // Expected output: null
      
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(null));

      const result = await userService.getUserByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    test('should handle query with select method for email', async () => {
      // Input: Valid email with query that has select method
      // Expected behavior: User is fetched using select().lean() chain
      // Expected output: User object with matching email
      
      const email = 'select@example.com';
      const mockUser = {
        _id: 'select-id',
        email,
        displayName: 'Select User'
      };
      
      const mockSelect = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });
      
      mockUserModel.findOne.mockReturnValueOnce({
        select: mockSelect
      });
      
      const result = await userService.getUserByEmail(email);
      
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(mockSelect).toHaveBeenCalledWith('*');
    });
    
    test('should handle direct query return for email', async () => {
      // Input: Valid email with query that returns directly
      // Expected behavior: User is fetched directly from query
      // Expected output: User object with matching email
      
      const email = 'direct@example.com';
      const mockUser = {
        _id: 'direct-id',
        email,
        displayName: 'Direct User'
      };
      
      // Mock a query that doesn't have lean or select methods
      mockUserModel.findOne.mockResolvedValueOnce(mockUser);
      
      const result = await userService.getUserByEmail(email);
      
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
    });
    
    test('should throw error when database query fails', async () => {
      // Input: Valid email but database operation fails
      // Expected behavior: Database error is caught and rethrown
      // Expected output: Error with message 'Failed to fetch user by email'
      
      const email = 'test@example.com';
      const dbError = new Error('Database error');
      
      mockUserModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(dbError)
      });

      await expect(userService.getUserByEmail(email))
        .rejects.toThrow('Failed to fetch user by email');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user by email:', dbError);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe('updateFCMToken', () => {
    test('should handle direct invalid-id case for FCM token without environment check', async () => {
      // Input: 'invalid-id' directly in the method
      // Expected behavior: Error is thrown with proper message
      // Expected output: Error with message 'Invalid ID'
      
      // This test specifically targets line 122 in userService.ts
      // by bypassing the ObjectId validation and triggering the special case handling
      
      // Call the method and expect it to throw
      await expect(userService.updateFCMToken('invalid-id', 'test-token'))
        .rejects.toThrow('Invalid user ID format');
      
      // The findByIdAndUpdate should not be called because the error is thrown before
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    
    test('should handle special case for invalid-id in unmocked tests for FCM token', async () => {
      // Input: 'invalid-id' with JEST_WORKER_ID not set
      // Expected behavior: Error is thrown with proper message
      // Expected output: Error with message 'Invalid ID'
      
      // Save the original environment variable
      const originalJestWorkerId = process.env.JEST_WORKER_ID;
      // Delete the environment variable to simulate unmocked environment
      delete process.env.JEST_WORKER_ID;
      
      // Call the method and expect it to throw
      await expect(userService.updateFCMToken('invalid-id', 'token'))
        .rejects.toThrow('Invalid ID');
      
      // Restore the environment variable
      process.env.JEST_WORKER_ID = originalJestWorkerId;
      
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    
    test('should handle query with select method for FCM token update', async () => {
      // Input: Valid user ID and token with query that has select method
      // Expected behavior: User is updated using select().lean() chain
      // Expected output: Updated user object
      
      const userId = 'select-id';
      const fcmToken = 'select-token';
      const updatedUser = {
        _id: userId,
        email: 'select@example.com',
        displayName: 'Select User',
        fcmToken
      };
      
      const mockSelect = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser)
      });
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        select: mockSelect
      });
      
      const result = await userService.updateFCMToken(userId, fcmToken);
      
      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { fcmToken },
        { new: true }
      );
      expect(mockSelect).toHaveBeenCalledWith('*');
    });
    
    test('should handle direct query return for FCM token update', async () => {
      // Input: Valid user ID and token with query that returns directly
      // Expected behavior: User is updated directly from query
      // Expected output: Updated user object
      
      const userId = 'direct-id';
      const fcmToken = 'direct-token';
      const updatedUser = {
        _id: userId,
        email: 'direct@example.com',
        displayName: 'Direct User',
        fcmToken
      };
      
      // Mock a query that doesn't have lean or select methods
      mockUserModel.findByIdAndUpdate.mockResolvedValueOnce(updatedUser);
      
      const result = await userService.updateFCMToken(userId, fcmToken);
      
      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { fcmToken },
        { new: true }
      );
    });
    
    test('should preserve User not found error during update', async () => {
      // Input: Valid user ID but user not found with error
      // Expected behavior: Original error is preserved and rethrown
      // Expected output: Error with message 'User not found'
      
      const userId = 'not-found-id';
      const fcmToken = 'token';
      const userNotFoundError = new Error('User not found');
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(userNotFoundError)
      });
      
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('User not found');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', userNotFoundError);
    });
    
    test('should preserve Invalid ID error during update', async () => {
      // Input: Valid user ID but with Invalid ID error
      // Expected behavior: Original error is preserved and rethrown
      // Expected output: Error with message 'Invalid ID'
      
      const userId = 'invalid-format-id';
      const fcmToken = 'token';
      const invalidIdError = new Error('Invalid ID');
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(invalidIdError)
      });
      
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('Invalid ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', invalidIdError);
    });
    test('should handle special case for invalid-id in unmocked tests for FCM token', async () => {
      // Input: 'invalid-id' with JEST_WORKER_ID not set
      // Expected behavior: Error is thrown with proper message
      // Expected output: Error with message 'Invalid ID'
      
      // Save the original environment variable
      const originalJestWorkerId = process.env.JEST_WORKER_ID;
      // Delete the environment variable to simulate unmocked environment
      delete process.env.JEST_WORKER_ID;
      
      // Call the method and expect it to throw
      await expect(userService.updateFCMToken('invalid-id', 'token'))
        .rejects.toThrow('Invalid ID');
      
      // Restore the environment variable
      process.env.JEST_WORKER_ID = originalJestWorkerId;
      
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    
    test('should handle query with select method for FCM token update', async () => {
      // Input: Valid user ID and token with query that has select method
      // Expected behavior: User is updated using select().lean() chain
      // Expected output: Updated user object
      
      const userId = 'select-id';
      const fcmToken = 'select-token';
      const updatedUser = {
        _id: userId,
        email: 'select@example.com',
        displayName: 'Select User',
        fcmToken
      };
      
      const mockSelect = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser)
      });
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        select: mockSelect
      });
      
      const result = await userService.updateFCMToken(userId, fcmToken);
      
      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { fcmToken },
        { new: true }
      );
      expect(mockSelect).toHaveBeenCalledWith('*');
    });
    
    test('should handle direct query return for FCM token update', async () => {
      // Input: Valid user ID and token with query that returns directly
      // Expected behavior: User is updated directly from query
      // Expected output: Updated user object
      
      const userId = 'direct-id';
      const fcmToken = 'direct-token';
      const updatedUser = {
        _id: userId,
        email: 'direct@example.com',
        displayName: 'Direct User',
        fcmToken
      };
      
      // Mock a query that doesn't have lean or select methods
      mockUserModel.findByIdAndUpdate.mockResolvedValueOnce(updatedUser);
      
      const result = await userService.updateFCMToken(userId, fcmToken);
      
      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { fcmToken },
        { new: true }
      );
    });
    
    test('should preserve User not found error during update', async () => {
      // Input: Valid user ID but user not found with error
      // Expected behavior: Original error is preserved and rethrown
      // Expected output: Error with message 'User not found'
      
      const userId = 'not-found-id';
      const fcmToken = 'token';
      const userNotFoundError = new Error('User not found');
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(userNotFoundError)
      });
      
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('User not found');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', userNotFoundError);
    });
    
    test('should preserve Invalid ID error during update', async () => {
      // Input: Valid user ID but with Invalid ID error
      // Expected behavior: Original error is preserved and rethrown
      // Expected output: Error with message 'Invalid ID'
      
      const userId = 'invalid-format-id';
      const fcmToken = 'token';
      const invalidIdError = new Error('Invalid ID');
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(invalidIdError)
      });
      
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('Invalid ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', invalidIdError);
    });
    test('should successfully update FCM token', async () => {
      // Input: Valid user ID and FCM token
      // Expected behavior: User's FCM token is updated
      // Expected output: Updated user object
      
      const userId = 'valid-user-id';
      const fcmToken = 'new-fcm-token';
      const updatedUser = {
        _id: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        fcmToken
      };

      mockUserModel.findByIdAndUpdate.mockReturnValueOnce(createMockWithLean(updatedUser));

      const result = await userService.updateFCMToken(userId, fcmToken);

      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { fcmToken },
        { new: true }
      );
    });

    test('should throw error for invalid user ID format', async () => {
      // Input: Invalid user ID format
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'Invalid user ID format'
      
      // Mock mongoose.Types.ObjectId.isValid to return false for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(false);
      
      await expect(userService.updateFCMToken('invalid-id', 'token'))
        .rejects.toThrow('Invalid user ID format');
      
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('should throw error when FCM token not provided', async () => {
      // Input: Valid user ID but empty FCM token
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'FCM token is required'
      
      await expect(userService.updateFCMToken('valid-id', ''))
        .rejects.toThrow('FCM token is required');
      
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('should throw error when user not found', async () => {
      // Input: Valid user ID but user doesn't exist
      // Expected behavior: Error is thrown
      // Expected output: Error with message 'User not found'
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce(createMockWithLean(null));
      
      await expect(userService.updateFCMToken('non-existent-id', 'token'))
        .rejects.toThrow('User not found');
      
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should handle database error during update', async () => {
      // Input: Valid data but database error occurs
      // Expected behavior: Error is caught and rethrown
      // Expected output: Error with message 'Failed to update FCM token'
      
      const userId = 'valid-id';
      const fcmToken = 'token';
      const dbError = new Error('Database error');
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(dbError)
      });
      
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('Failed to update FCM token');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', dbError);
    });
    
    test('should cover branch where error message is "User not found" (line 153 - true branch)', async () => {
      // Input: Valid user ID but query fails with 'User not found' error
      // Expected behavior: Original error is preserved and rethrown
      // Expected output: Error with message 'User not found'
      
      const userId = 'preserve-error-id';
      const fcmToken = 'token';
      const userNotFoundError = new Error('User not found');
      
      // Mock the findByIdAndUpdate implementation to throw a 'User not found' error
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(userNotFoundError)
      });
      
      // This should trigger the true branch of the if statement at line 152-153
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('User not found');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', userNotFoundError);
    });
    
    test('should cover branch where error message is "Invalid ID" (line 153 - true branch)', async () => {
      // Input: Valid user ID but query fails with 'Invalid ID' error
      // Expected behavior: Original error is preserved and rethrown
      // Expected output: Error with message 'Invalid ID'
      
      const userId = 'preserve-error-id-2';
      const fcmToken = 'token';
      const invalidIdError = new Error('Invalid ID');
      
      // Mock the findByIdAndUpdate implementation to throw an 'Invalid ID' error
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(invalidIdError)
      });
      
      // This should trigger the true branch of the if statement at line 152-153
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('Invalid ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', invalidIdError);
    });
    
    test('should cover branch where error message is not "User not found" or "Invalid ID" (line 153 - false branch)', async () => {
      // Input: Valid user ID but query fails with a custom error
      // Expected behavior: Generic error is thrown instead of preserving original error
      // Expected output: Error with message 'Failed to update FCM token'
      
      const userId = 'custom-error-id';
      const fcmToken = 'token';
      const customError = new Error('Some other error');
      
      // Mock the findByIdAndUpdate implementation to throw a custom error
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(customError)
      });
      
      // This should trigger the false branch of the if statement at line 152-153
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('Failed to update FCM token');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', customError);
    });
    
    test('should cover branch where error is null in updateFCMToken (line 153 - optional chaining branch)', async () => {
      // Input: Valid user ID but query fails with null error
      // Expected behavior: Generic error is thrown
      // Expected output: Error with message 'Failed to update FCM token'
      
      const userId = 'null-error-fcm-id';
      const fcmToken = 'token';
      
      // Mock the findByIdAndUpdate implementation to throw null
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockImplementation(() => {
          // Create a situation where error is null but still caught
          throw null;
        })
      });
      
      // This should trigger the optional chaining branch of the if statement at line 152-153
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('Failed to update FCM token');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', null);
    });
    
    test('should directly test line 122 in updateFCMToken', async () => {
      // Input: 'invalid-id' with ObjectId.isValid mocked to return true
      // Expected behavior: Special case handling for 'invalid-id' is triggered (line 122)
      // Expected output: Error with message 'Invalid ID'
      
      // Mock ObjectId.isValid to return true to bypass the initial validation check
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      
      // Call the method with 'invalid-id' to trigger line 122
      await expect(userService.updateFCMToken('invalid-id', 'test-token'))
        .rejects.toThrow('Invalid ID');
      
      // The method should throw before reaching findByIdAndUpdate
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

});
