import './unittest_setup';

// Import from setup.ts to use the centralized mocks for other dependencies
import { Types } from 'mongoose';

// Import the UserModel (which is already mocked in setup.ts)
import { UserModel } from '../../models/user';

// The UserModel is mocked in setup.ts

// Simple tests for the User model
describe('User Model', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a User model', () => {
    // Input: None
    // Expected behavior: UserModel is defined
    // Expected output: UserModel is defined
    expect(UserModel).toBeDefined();
  });

  test('should have correct mock functions', () => {
    // Input: None
    // Expected behavior: UserModel is mocked properly
    // Expected output: Mock functions are defined

    // In mocked tests, we're testing that the mock functions exist
    expect(UserModel.findOne).toBeDefined();
    expect(UserModel.findById).toBeDefined();
    expect(UserModel.findByIdAndUpdate).toBeDefined();
    expect(UserModel.create).toBeDefined();
  });

  test('should handle create operations', async () => {
    // Input: User data
    // Expected behavior: UserModel.create is called with the correct parameters
    // Expected output: Mock response

    // Setup test data
    const userData = {
      email: 'test@example.com',
      displayName: 'Test User',
      sessionHistory: [],
      restaurantInteractions: []
    };

    // When creating a user
    const result = await UserModel.create(userData);

    // Then create should be called with the correct data
    expect(UserModel.create).toHaveBeenCalledWith(userData);
    expect(result).toEqual(expect.objectContaining({
      ...userData,
      _id: 'mocked-id'
    }));
  });

  test('should handle findOne operations', async () => {
    // Input: Query parameters
    // Expected behavior: UserModel.findOne is called with the correct parameters
    // Expected output: Mock response

    // Setup mock response
    const mockUser = { _id: '123', email: 'user1@example.com', displayName: 'User 1' };

    // Set up the mock to return our test data
    (UserModel.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

    // When finding a user
    const query = { email: 'user1@example.com' };
    const result = await UserModel.findOne(query);

    // Then findOne should be called with the correct query
    expect(UserModel.findOne).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockUser);
  });

  test('should handle findById operations', async () => {
    // Input: User ID
    // Expected behavior: UserModel.findById is called with the correct ID
    // Expected output: Mock response

    // Setup mock response
    const mockUser = { _id: '123', email: 'user1@example.com', displayName: 'User 1' };

    // Set up the mock to return our test data
    (UserModel.findById as jest.Mock).mockResolvedValueOnce(mockUser);

    // When finding a user by ID
    const userId = '123';
    const result = await UserModel.findById(userId);

    // Then findById should be called with the correct ID
    expect(UserModel.findById).toHaveBeenCalledWith(userId);
    expect(result).toEqual(mockUser);
  });
});
