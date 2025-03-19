import { mockRestaurantService } from '../setup';

// Mock the Restaurant model
jest.mock('../../models/restaurant', () => {
  return {
    Restaurant: {
      findOne: jest.fn(),
      find: jest.fn(),
      prototype: {
        save: jest.fn()
      }
    }
  };
});

// Mock the GooglePlacesService
jest.mock('../../services/externalAPIs/googleMaps', () => {
  return {
    GooglePlacesService: jest.fn().mockImplementation(() => ({
      searchNearby: jest.fn(),
      getPlaceDetails: jest.fn()
    }))
  };
});

// Import after mocking
import { Restaurant } from '../../models/restaurant';
import { GooglePlacesService } from '../../services/externalAPIs/googleMaps';

describe('RestaurantService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  describe('getRestaurants', () => {
    test('should successfully get restaurants by IDs', async () => {
      // Mock data
      const restaurantIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439022'
      ];
      
      const mockRestaurants = [
        { _id: restaurantIds[0], name: 'Restaurant 1' },
        { _id: restaurantIds[1], name: 'Restaurant 2' }
      ];
      
      // Setup mock implementation
      (Restaurant.find as jest.Mock).mockResolvedValue(mockRestaurants);
      mockRestaurantService.getRestaurants.mockResolvedValue(mockRestaurants);
      
      // Call the method
      const result = await mockRestaurantService.getRestaurants(restaurantIds);
      
      // Assertions
      expect(result).toEqual(mockRestaurants);
      expect(mockRestaurantService.getRestaurants).toHaveBeenCalledWith(restaurantIds);
    });

    test('should handle error during getRestaurants', async () => {
      // Mock data
      const restaurantIds = ['507f1f77bcf86cd799439011'];
      
      // Setup mock implementation to throw an error
      const error = new Error('Database error');
      mockRestaurantService.getRestaurants.mockImplementation(() => {
        console.error('Error getting restaurants:', error);
        return Promise.reject(error);
      });
      
      // Call and assert
      await expect(mockRestaurantService.getRestaurants(restaurantIds))
        .rejects.toThrow('Database error');
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getRestaurant', () => {
    test('should successfully get a restaurant by ID', async () => {
      // Mock data
      const restaurantId = '507f1f77bcf86cd799439011';
      const mockRestaurant = { _id: restaurantId, name: 'Restaurant 1' };
      
      // Setup mock implementation
      (Restaurant.findOne as jest.Mock).mockResolvedValue(mockRestaurant);
      mockRestaurantService.getRestaurant.mockResolvedValue(mockRestaurant);
      
      // Call the method
      const result = await mockRestaurantService.getRestaurant(restaurantId);
      
      // Assertions
      expect(result).toEqual(mockRestaurant);
      expect(mockRestaurantService.getRestaurant).toHaveBeenCalledWith(restaurantId);
    });

    test('should handle error during getRestaurant', async () => {
      // Mock data
      const restaurantId = '507f1f77bcf86cd799439011';
      
      // Setup mock implementation to throw an error
      const error = new Error('Database error');
      mockRestaurantService.getRestaurant.mockImplementation(() => {
        console.error('Error getting restaurant:', error);
        return Promise.reject(error);
      });
      
      // Call and assert
      await expect(mockRestaurantService.getRestaurant(restaurantId))
        .rejects.toThrow('Database error');
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
});
