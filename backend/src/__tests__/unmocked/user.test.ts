import { UserService } from '../../services/userService';
import { SessionManager } from '../../services/sessionManager';
import { RestaurantService } from '../../services/restaurantService';


// First, mock mongoose to provide a working ObjectId implementation
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

jest.unmock('../../services/userService');
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
    
      if(query.email === 'test@test.com'){
        return Promise.resolve(null);
      }
      if (query.email === 'test@example.com') {
        return {
          select: () => ({
            lean: () => Promise.resolve({
              _id: 'existingUserId',
              email: 'test@example.com',
              displayName: 'Test User',
            }),
          }),
        };
      }
      return { select: () => ({ lean: () => Promise.resolve(null) }) };
    }),

    findById: jest.fn().mockImplementation((id) => {
      if (id.toString() === 'invalid-id') {
        return { select: () => ({ lean: () => Promise.reject(new Error('Invalid ID')) }) };
      }
      if (id.toString() === 'nonexistentId') {
        return { select: () => ({ lean: () => Promise.resolve(null) }) };
      }
      return {
        select: () => ({
          lean: () => Promise.resolve({
            _id: id,
            email: 'test@example.com',
            displayName: 'Test User',
          }),
        }),
      };
    }),

    create: jest.fn().mockImplementation((data) => Promise.resolve({ _id: 'newUserId', ...data })),

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

jest.mock('../../services/sessionManager');

describe('UserService', () => {
    let userService: UserService
    let mockSessionManager: jest.Mocked<SessionManager>;
    let mockRestaurantService: jest.Mocked<RestaurantService>;

    beforeEach(() => {
        userService = new UserService();
        mockRestaurantService = new RestaurantService() as jest.Mocked<RestaurantService>;
        mockSessionManager = new SessionManager(mockRestaurantService) as jest.Mocked<SessionManager>;
    });

    test('call getUser with invalid ID', async () => {
      await expect(userService.getUserById('invalid-id'))
        .rejects.toThrow('Invalid ID');
    });

    test('call getUserById and return user', async () => {
        const response = await userService.getUserById('testUserId');
        expect(response?.email).toBe('test@example.com');
        expect(response?.displayName).toBe('Test User');
    });

    test('call createUser existing user', async () => {
        try {
          await userService.createUser('test@example.com', 'Test User');
        } catch (error) {
          console.log(error);
        }
    });

    test('call createUser', async () => {
        const response = await userService.createUser('test@test.com','new-user');
        expect(response?.email).toBe('test@test.com');
        expect(response?.displayName).toBe('new-user');
    });

});
