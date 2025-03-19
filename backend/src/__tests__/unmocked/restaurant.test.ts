import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { RestaurantService } from '../../services/restaurantService';
import { GooglePlacesService } from '../../services/externalAPIs/googleMaps';

// Mock dependencies
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

jest.mock('../../services/externalAPIs/googleMaps', () => {
  return {
    GooglePlacesService: jest.fn().mockImplementation(() => ({
      searchNearby: jest.fn(),
      getPlaceDetails: jest.fn()
    })),
    GooglePlaceDetails: jest.fn()
  };
});

jest.mock('../../models/restaurant', () => {
  const RestaurantModel = jest.fn().mockImplementation(function (this: any, data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  });

  Object.assign(RestaurantModel, {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn()
  });

  return { Restaurant: RestaurantModel };
});

jest.unmock('../../services/restaurantService');

describe('RestaurantService', () => {
  let restaurantService: RestaurantService;
  let mockGooglePlacesService: jest.Mocked<GooglePlacesService>;

  beforeEach(() => {
    jest.clearAllMocks();
    restaurantService = new RestaurantService();
    mockGooglePlacesService = (restaurantService as any).googlePlacesService;
  });

  describe('addRestaurants', () => {
    const location = { 
      latitude: 49.2827, 
      longitude: -123.1207, 
      radius: 500 
    };
    
    const mockPlaces = [
      { place_id: 'place1', name: 'Restaurant 1' },
      { place_id: 'place2', name: 'Restaurant 2' }
    ];
    
    const mockPlaceDetails = {
      place_id: 'place1',
      name: 'Test Restaurant',
      formatted_address: '123 Test St',
      geometry: {
        location: {
          lat: 49.2827,
          lng: -123.1207
        }
      },
      formatted_phone_number: '123-456-7890',
      website: 'https://testrestaurant.com',
      photos_url: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
      price_level: 2,
      rating: 4.5,
      opening_hours: {
        open_now: true,
        weekday_text: ['Monday: 9AM-5PM', 'Tuesday: 9AM-5PM']
      }
    };

    test('should add new restaurants successfully', async () => {
      // Setup
      mockGooglePlacesService.searchNearby.mockResolvedValue(mockPlaces as any);
      mockGooglePlacesService.getPlaceDetails.mockResolvedValue(mockPlaceDetails as any);
      
      require('../../models/restaurant').Restaurant.findOne.mockResolvedValue(null);
      
      // Execute
      const result = await restaurantService.addRestaurants(location);
      
      // Assert
      expect(mockGooglePlacesService.searchNearby).toHaveBeenCalledWith(
        location.latitude,
        location.longitude,
        location.radius,
        undefined
      );
      
      expect(mockGooglePlacesService.getPlaceDetails).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      
      // Check restaurant model is created with correct data
      expect(require('../../models/restaurant').Restaurant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockPlaceDetails.name,
          location: expect.objectContaining({
            address: mockPlaceDetails.formatted_address,
            coordinates: expect.objectContaining({
              latitude: mockPlaceDetails.geometry.location.lat,
              longitude: mockPlaceDetails.geometry.location.lng
            })
          }),
          sourceData: expect.objectContaining({
            googlePlaceId: mockPlaces[0].place_id
          })
        })
      );
    });

    test('should skip restaurant if it already exists', async () => {
      // Setup
      mockGooglePlacesService.searchNearby.mockResolvedValue(mockPlaces as any);
      
      const existingRestaurant = {
        _id: 'existingId',
        name: 'Existing Restaurant',
        sourceData: {
          googlePlaceId: 'place1'
        }
      };
      
      require('../../models/restaurant').Restaurant.findOne
        .mockImplementation((query: any) => {
          if (query['sourceData.googlePlaceId'] === 'place1') {
            return Promise.resolve(existingRestaurant);
          }
          return Promise.resolve(null);
        });
      
      mockGooglePlacesService.getPlaceDetails.mockResolvedValue(mockPlaceDetails);
      
      // Execute
      const result = await restaurantService.addRestaurants(location);
      
      // Assert
      expect(mockGooglePlacesService.getPlaceDetails).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(existingRestaurant);
    });

    test('should skip restaurant if place details are not available', async () => {
      // Setup
      mockGooglePlacesService.searchNearby.mockResolvedValue(mockPlaces as any);
      
      require('../../models/restaurant').Restaurant.findOne.mockResolvedValue(null);
      
      mockGooglePlacesService.getPlaceDetails
        .mockImplementation((placeId) => {
          if (placeId === 'place1') {
            return Promise.resolve(mockPlaceDetails);
          }
          return Promise.resolve(null);
        });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Execute
      const result = await restaurantService.addRestaurants(location);
      
      // Assert
      expect(mockGooglePlacesService.getPlaceDetails).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get details for place ID: place2')
      );
      expect(result).toHaveLength(1);
      
      consoleSpy.mockRestore();
    });

    test('should handle search with keyword parameter', async () => {
      // Setup
      const keyword = 'pizza';
      mockGooglePlacesService.searchNearby.mockResolvedValue([]);
      
      // Execute
      await restaurantService.addRestaurants(location, keyword);
      
      // Assert
      expect(mockGooglePlacesService.searchNearby).toHaveBeenCalledWith(
        location.latitude,
        location.longitude,
        location.radius,
        keyword
      );
    });

    test('should handle error in Google Places API', async () => {
      // Setup
      const apiError = new Error('API error');
      mockGooglePlacesService.searchNearby.mockRejectedValue(apiError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Execute & Assert
      await expect(restaurantService.addRestaurants(location))
        .rejects.toThrow('Failed to create restaurants');
      
      expect(consoleSpy).toHaveBeenCalledWith(apiError);
      
      consoleSpy.mockRestore();
    });

    // test('should create restaurant with minimal data when optional fields are missing', async () => {
    //   // Setup
    //   mockGooglePlacesService.searchNearby.mockResolvedValue([{ place_id: 'place1' }: any]);
      
    //   const minimalDetails = {
    //     name: 'Minimal Restaurant',
    //     formatted_address: '123 Main St',
    //     geometry: {
    //       location: {
    //         lat: 49.2827,
    //         lng: -123.1207
    //       }
    //     },
    //     // Missing optional fields
    //     photos_url: undefined,
    //     price_level: undefined,
    //     rating: undefined,
    //     opening_hours: undefined,
    //     formatted_phone_number: undefined,
    //     website: undefined
    //   };
      
    //   mockGooglePlacesService.getPlaceDetails.mockResolvedValue(minimalDetails);
    //   require('../../models/restaurant').Restaurant.findOne.mockResolvedValue(null);
      
    //   // Execute
    //   const result = await restaurantService.addRestaurants(location);
      
    //   // Assert
    //   expect(result).toHaveLength(1);
    //   expect(require('../../models/restaurant').Restaurant).toHaveBeenCalledWith(
    //     expect.objectContaining({
    //       name: minimalDetails.name,
    //       images: { primary: '', gallery: [] },
    //       priceLevel: 0,
    //       rating: 0,
    //       contact: { phone: ' ', website: ' ' },
    //       openingHours: undefined
    //     })
    //   );
    // });
  });

  describe('getRestaurants', () => {
    test('should return multiple restaurants by ids', async () => {
      // Setup
      const restaurantIds = [
        new mongoose.Types.ObjectId('restaurant1'), 
        new mongoose.Types.ObjectId('restaurant2')
      ];
      
      const mockRestaurants = [
        { _id: 'restaurant1', name: 'Restaurant 1' },
        { _id: 'restaurant2', name: 'Restaurant 2' }
      ];
      
      require('../../models/restaurant').Restaurant.find.mockResolvedValue(mockRestaurants);
      
      // Execute
      const result = await restaurantService.getRestaurants(restaurantIds);
      
      // Assert
      expect(result).toEqual(mockRestaurants);
      expect(require('../../models/restaurant').Restaurant.find).toHaveBeenCalledWith({
        _id: { $in: restaurantIds }
      });
    });

    test('should handle empty id array', async () => {
      // Setup
      const emptyIds: Types.ObjectId[] = [];
      require('../../models/restaurant').Restaurant.find.mockResolvedValue([]);
      
      // Execute
      const result = await restaurantService.getRestaurants(emptyIds);
      
      // Assert
      expect(result).toEqual([]);
      expect(require('../../models/restaurant').Restaurant.find).toHaveBeenCalledWith({
        _id: { $in: [] }
      });
    });

    test('should handle error when finding restaurants', async () => {
      // Setup
      const restaurantIds = [new mongoose.Types.ObjectId('restaurant1')];
      const dbError = new Error('Database error');
      
      require('../../models/restaurant').Restaurant.find.mockRejectedValue(dbError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Execute & Assert
      await expect(restaurantService.getRestaurants(restaurantIds))
        .rejects.toThrow('Failed to get restaurants');
      
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('getRestaurant', () => {
    test('should return a single restaurant by id', async () => {
      // Setup
      const restaurantId = new mongoose.Types.ObjectId('restaurant1');
      const mockRestaurant = { 
        _id: 'restaurant1', 
        name: 'Test Restaurant' 
      };
      
      require('../../models/restaurant').Restaurant.findOne.mockResolvedValue(mockRestaurant);
      
      // Execute
      const result = await restaurantService.getRestaurant(restaurantId);
      
      // Assert
      expect(result).toEqual(mockRestaurant);
      expect(require('../../models/restaurant').Restaurant.findOne).toHaveBeenCalledWith({
        _id: restaurantId
      });
    });

    test('should return null when restaurant not found', async () => {
      // Setup
      const restaurantId = new mongoose.Types.ObjectId('nonexistent');
      require('../../models/restaurant').Restaurant.findOne.mockResolvedValue(null);
      
      // Execute
      const result = await restaurantService.getRestaurant(restaurantId);
      
      // Assert
      expect(result).toBeNull();
    });

    test('should handle error when finding restaurant', async () => {
      // Setup
      const restaurantId = new mongoose.Types.ObjectId('restaurant1');
      const dbError = new Error('Database error');
      
      require('../../models/restaurant').Restaurant.findOne.mockRejectedValue(dbError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Execute & Assert
      await expect(restaurantService.getRestaurant(restaurantId))
        .rejects.toThrow('Failed to get restaurant');
      
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
      
      consoleSpy.mockRestore();
    });
  });
});