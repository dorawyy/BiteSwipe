import '../mocked/mocked_setup';

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
import { RestaurantService } from '../../services/restaurantService';
import { Types } from 'mongoose';

describe('RestaurantService', () => {
  let restaurantService: RestaurantService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a new instance of RestaurantService for each test
    restaurantService = new RestaurantService();
  });
  
  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe('getRestaurants', () => {
    test('should successfully get restaurants by IDs', async () => {
      // Input: Array of restaurant IDs
      // Expected behavior: Database is queried for restaurants with matching IDs
      // Expected output: Array of restaurant objects
      
      // Mock data
      const restaurantIdStrings = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439022'
      ];
      
      // Convert string IDs to ObjectId
      const restaurantIds = restaurantIdStrings.map(id => new Types.ObjectId(id));
      
      const mockRestaurants = [
        { _id: restaurantIds[0], name: 'Restaurant 1' },
        { _id: restaurantIds[1], name: 'Restaurant 2' }
      ];
      
      // Setup mock implementation
      (Restaurant.find as jest.Mock).mockResolvedValue(mockRestaurants);
      
      // Call the method
      const result = await restaurantService.getRestaurants(restaurantIds);
      
      // Assertions
      expect(result).toEqual(mockRestaurants);
      expect(Restaurant.find).toHaveBeenCalledWith({ _id: { $in: restaurantIds } });
    });

    test('should handle error during getRestaurants', async () => {
      // Input: Array of restaurant IDs
      // Expected behavior: Database error is caught and rethrown
      // Expected output: Error with message 'Failed to get restaurants'
      
      // Mock data
      const restaurantIdString = '507f1f77bcf86cd799439011';
      const restaurantIds = [new Types.ObjectId(restaurantIdString)];
      
      // Setup mock implementation to throw an error
      const error = new Error('Database error');
      (Restaurant.find as jest.Mock).mockRejectedValue(error);
      
      // Call and assert
      await expect(restaurantService.getRestaurants(restaurantIds))
        .rejects.toThrow('Failed to get restaurants');
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    test('should return empty array when no IDs are provided', async () => {
      // Input: Empty array of restaurant IDs
      // Expected behavior: Restaurant.find is called with an empty array
      // Expected output: Empty array
      
      // Setup mock implementation
      (Restaurant.find as jest.Mock).mockResolvedValue([]);
      
      // Call the method with empty array
      const result = await restaurantService.getRestaurants([]);
      
      // Assertions
      expect(result).toEqual([]);
      expect(Restaurant.find).toHaveBeenCalledWith({ _id: { $in: [] } });
    });
  });

  describe('getRestaurant', () => {
    test('should successfully get a restaurant by ID', async () => {
      // Input: Valid restaurant ID
      // Expected behavior: Database is queried for restaurant with matching ID
      // Expected output: Restaurant object
      
      // Mock data
      const restaurantIdString = '507f1f77bcf86cd799439011';
      const restaurantId = new Types.ObjectId(restaurantIdString);
      const mockRestaurant = { _id: restaurantId, name: 'Restaurant 1' };
      
      // Setup mock implementation
      (Restaurant.findOne as jest.Mock).mockResolvedValue(mockRestaurant);
      
      // Call the method
      const result = await restaurantService.getRestaurant(restaurantId);
      
      // Assertions
      expect(result).toEqual(mockRestaurant);
      expect(Restaurant.findOne).toHaveBeenCalledWith({ _id: restaurantId });
    });

    test('should handle error during getRestaurant', async () => {
      // Input: Valid restaurant ID
      // Expected behavior: Database error is caught and rethrown
      // Expected output: Error with message 'Failed to get restaurant'
      
      // Mock data
      const restaurantIdString = '507f1f77bcf86cd799439011';
      const restaurantId = new Types.ObjectId(restaurantIdString);
      
      // Setup mock implementation to throw an error
      const error = new Error('Database error');
      (Restaurant.findOne as jest.Mock).mockRejectedValue(error);
      
      // Call and assert
      await expect(restaurantService.getRestaurant(restaurantId))
        .rejects.toThrow('Failed to get restaurant');
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    test('should return null when restaurant is not found', async () => {
      // Input: Valid restaurant ID that doesn't exist
      // Expected behavior: Database returns null
      // Expected output: null
      
      // Mock data
      const restaurantIdString = '507f1f77bcf86cd799439011';
      const restaurantId = new Types.ObjectId(restaurantIdString);
      
      // Setup mock implementation
      (Restaurant.findOne as jest.Mock).mockResolvedValue(null);
      
      // Call the method
      const result = await restaurantService.getRestaurant(restaurantId);
      
      // Assertions
      expect(result).toBeNull();
      expect(Restaurant.findOne).toHaveBeenCalledWith({ _id: restaurantId });
    });
  });

  describe('addRestaurants', () => {
    // TODO FIX
    // test('should successfully add restaurants', async () => {
    //   // Input: Location with latitude, longitude, and radius
    //   // Expected behavior: GooglePlacesService is called to search nearby and get details
    //   // Expected output: Array of saved restaurant objects
      
    //   // Mock data
    //   const location = { latitude: 49.2827, longitude: -123.1207, radius: 5000 };
    //   const mockPlaces = [
    //     { place_id: 'place1', name: 'Restaurant 1' }
    //   ];
      
    //   const mockDetails = { 
    //     place_id: 'place1', 
    //     name: 'Restaurant 1',
    //     formatted_address: '123 Main St',
    //     photos_url: ['photo1.jpg', 'photo2.jpg'],
    //     geometry: {
    //       location: {
    //         lat: 49.2827,
    //         lng: -123.1207
    //       }
    //     },
    //     rating: 4.5,
    //     price_level: 2,
    //     opening_hours: {
    //       open_now: true,
    //       weekday_text: ['Monday: 9AM-9PM']
    //     }
    //   };
      
    //   const mockSavedRestaurant = {
    //     _id: '507f1f77bcf86cd799439011',
    //     name: 'Restaurant 1',
    //     location: {
    //       address: '123 Main St',
    //       coordinates: {
    //         latitude: 49.2827,
    //         longitude: -123.1207
    //       }
    //     }
    //   };
      
    //   // Setup mock implementation for GooglePlacesService
    //   const mockGooglePlacesService = {
    //     searchNearby: jest.fn().mockResolvedValue(mockPlaces),
    //     getPlaceDetails: jest.fn().mockResolvedValue(mockDetails)
    //   };
      
    //   // Create a new RestaurantService with our mocked GooglePlacesService
    //   const localRestaurantService = new RestaurantService(mockGooglePlacesService as unknown as GooglePlacesService);
      
    //   // Mock Restaurant.findOne to return null (restaurant doesn't exist)
    //   (Restaurant.findOne as jest.Mock).mockResolvedValue(null);
      
    //   // Create a mock for the save method that returns our expected result
    //   const saveMock = jest.fn().mockImplementation(function(this: any) {
    //     console.log('save method called with:', this);
    //     return Promise.resolve(mockSavedRestaurant);
    //   });
      
    //   // Create a proper class-based mock for the Restaurant constructor
    //   class MockRestaurantClass {
    //     [key: string]: any;
        
    //     constructor(data: any) {
    //       console.log('MockRestaurantClass constructor called with:', data);
    //       // Copy all properties from the data object
    //       Object.assign(this, data);
    //       // Ensure we have a save method
    //       this.save = saveMock;
    //     }
    //   }
      
    //   // Convert the class to a Jest mock function
    //   const MockRestaurant = jest.fn().mockImplementation((data: any) => {
    //     console.log('MockRestaurant called with:', data);
    //     return new MockRestaurantClass(data);
    //   });
      
    //   // Store the original Restaurant constructor
    //   const originalRestaurant = Restaurant;
      
    //   // Replace the Restaurant constructor with our mock
    //   (global as any).Restaurant = MockRestaurant;
      
    //   // Also mock the mongoose model static methods that might be used
    //   (MockRestaurant as any).findOne = Restaurant.findOne;
    //   (MockRestaurant as any).find = Restaurant.find;
      
    //   try {
    //     // Add a spy on console.error to capture any errors
    //     const consoleErrorSpy = jest.spyOn(console, 'error');
        
    //     // Call the method
    //     const result = await localRestaurantService.addRestaurants(location);
        
    //     // Log what we got back
    //     console.log('Test result:', JSON.stringify(result));
        
    //     // Check if any errors were logged
    //     if (consoleErrorSpy.mock.calls.length > 0) {
    //       console.log('Errors logged during test:', consoleErrorSpy.mock.calls);
    //     }
        
    //     // Assertions
    //     expect(result).toEqual([mockSavedRestaurant]);
    //     expect(mockGooglePlacesService.searchNearby).toHaveBeenCalledWith(
    //       location.latitude, 
    //       location.longitude, 
    //       location.radius, 
    //       undefined
    //     );
    //     expect(mockGooglePlacesService.getPlaceDetails).toHaveBeenCalledWith('place1');
    //     expect(Restaurant.findOne).toHaveBeenCalledWith({ 'sourceData.googlePlaceId': 'place1' });
    //     expect(saveMock).toHaveBeenCalled();
    //     expect(MockRestaurant).toHaveBeenCalled();
        
    //     // Restore the spy
    //     consoleErrorSpy.mockRestore();
    //   } catch (error) {
    //     console.error('Test error:', error);
    //     // Log the full error details to understand what's happening
    //     if (error instanceof Error) {
    //       console.error('Error message:', error.message);
    //       console.error('Error stack:', error.stack);
    //     } else {
    //       console.error('Non-Error object thrown:', error);
    //     }
    //     throw error;
    //   } finally {
    //     // Restore the original Restaurant constructor to avoid affecting other tests
    //     (global as any).Restaurant = originalRestaurant;
    //   }
    // });
    
    test('should skip restaurant if it already exists', async () => {
      // Input: Location with latitude, longitude, and radius
      // Expected behavior: Existing restaurant is found and not recreated
      // Expected output: Array containing the existing restaurant
      
      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207, radius: 5000 };
      const mockPlaces = [{ place_id: 'place1', name: 'Restaurant 1' }];
      
      const existingRestaurant = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Existing Restaurant',
        sourceData: {
          googlePlaceId: 'place1'
        }
      };
      
      // Setup mock implementation
      const mockGooglePlacesService = new GooglePlacesService();
      (mockGooglePlacesService.searchNearby as jest.Mock).mockResolvedValue(mockPlaces);
      (GooglePlacesService as jest.Mock).mockImplementation(() => mockGooglePlacesService);
      
      // Mock Restaurant.findOne to return an existing restaurant
      (Restaurant.findOne as jest.Mock).mockResolvedValue(existingRestaurant);
      
      // Call the method
      const result = await restaurantService.addRestaurants(location);
      
      // Assertions
      expect(result).toContainEqual(existingRestaurant);
      expect(mockGooglePlacesService.getPlaceDetails).not.toHaveBeenCalled();
    });
    
    test('should handle error during addRestaurants', async () => {
      // Input: Location with latitude, longitude, and radius
      // Expected behavior: GooglePlacesService error is caught and rethrown
      // Expected output: Error with message 'Failed to create restaurants'
      
      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207, radius: 5000 };
      
      // Setup mock implementation to throw an error
      const error = new Error('API error');
      const mockGooglePlacesService = new GooglePlacesService();
      (mockGooglePlacesService.searchNearby as jest.Mock).mockRejectedValue(error);
      (GooglePlacesService as jest.Mock).mockImplementation(() => mockGooglePlacesService);
      
      // Call and assert
      await expect(restaurantService.addRestaurants(location))
        .rejects.toThrow('Failed to create restaurants');
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
