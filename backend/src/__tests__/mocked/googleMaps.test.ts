import axios from 'axios';
import { GooglePlacesService, GooglePlaceDetails, GooglePlaceSearchResult } from '../../services/externalAPIs/googleMaps'; // Update with correct path

// Mock axios
jest.mock('axios');
jest.unmock('../../services/externalAPIs/googleMaps'); // Update with correct path
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GooglePlacesService', () => {
  // Store original env
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set up environment variables for testing
    process.env = { ...originalEnv, GOOGLE_MAPS_API_KEY: 'test-api-key' };
  });
  
  afterEach(() => {
    // Restore original env after tests
    process.env = originalEnv;
  });
  
  describe('constructor', () => {
    test('should initialize with API key from environment', () => {
      const service = new GooglePlacesService();
      // Using any to access private property for testing
      expect((service as any).apiKey).toBe('test-api-key');
    });
    
    test('should throw error if API key is not provided', () => {
      // Temporarily remove API key
      delete process.env.GOOGLE_MAPS_API_KEY;
      
      expect(() => {
        new GooglePlacesService();
      }).toThrow('Google Maps API key is required');
    });
  });
  
  describe('searchNearby', () => {
    const mockSearchResponse = {
      data: {
        status: 'OK',
        results: [
          {
            place_id: 'place1',
            name: 'Restaurant 1',
            geometry: { location: { lat: 37.7749, lng: -122.4194 } },
            types: ['restaurant', 'food']
          },
          {
            place_id: 'place2',
            name: 'Hotel Restaurant',
            geometry: { location: { lat: 37.7750, lng: -122.4195 } },
            types: ['restaurant', 'lodging']
          },
          {
            place_id: 'place3',
            name: 'Cafe',
            geometry: { location: { lat: 37.7751, lng: -122.4196 } },
            types: ['cafe']
          },
          {
            place_id: 'place4',
            name: 'Hotel',
            geometry: { location: { lat: 37.7752, lng: -122.4197 } },
            types: ['lodging', 'restaurant'] // lodging comes before restaurant
          },
          {
            place_id: 'place5',
            name: 'Gas Station',
            geometry: { location: { lat: 37.7753, lng: -122.4198 } },
            types: ['gas_station']
          }
        ]
      }
    };
    
    test('should fetch and filter nearby restaurants correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);
      
      const service = new GooglePlacesService();
      const result = await service.searchNearby(37.7749, -122.4194, 1000);
      
      // Check axios was called with correct parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: '37.7749,-122.4194',
            radius: 1000,
            type: 'restaurant',
            keyword: 'food',
            key: 'test-api-key'
          }
        }
      );
      
      // Should return only restaurant, cafe and places where restaurant type comes before lodging
      expect(result).toHaveLength(3);
      expect(result[0].place_id).toBe('place1');
      expect(result[1].place_id).toBe('place2');
      expect(result[2].place_id).toBe('place3');
    });
    
    test('should use provided keyword if specified', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);
      
      const service = new GooglePlacesService();
      await service.searchNearby(37.7749, -122.4194, 1000, 'italian');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            keyword: 'italian'
          })
        })
      );
    });
    
    test('should handle places with undefined types', async () => {
      const responseWithUndefinedTypes = {
        data: {
          status: 'OK',
          results: [
            {
              place_id: 'place1',
              name: 'Restaurant 1',
              geometry: { location: { lat: 37.7749, lng: -122.4194 } },
              // No types field
            }
          ]
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(responseWithUndefinedTypes);
      
      const service = new GooglePlacesService();
      const result = await service.searchNearby(37.7749, -122.4194, 1000);
      
      // Should handle places with no types without errors
      expect(result).toHaveLength(0);
    });
    
    test('should throw error when API returns non-OK status', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          status: 'ZERO_RESULTS',
          results: []
        }
      });
      
      const service = new GooglePlacesService();
      await expect(service.searchNearby(37.7749, -122.4194, 1000))
        .rejects
        .toThrow('Failed to fetch nearby places');
        
      expect(console.error).toHaveBeenCalled;
    });
    
    test('should throw error when API request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      const service = new GooglePlacesService();
      await expect(service.searchNearby(37.7749, -122.4194, 1000))
        .rejects
        .toThrow('Failed to fetch nearby places');
        
      expect(console.error).toHaveBeenCalled;
    });
  });
  
  describe('getPlaceDetails', () => {
    const mockPlaceDetails: GooglePlaceDetails = {
      place_id: 'test-place-id',
      name: 'Restaurant Name',
      formatted_address: '123 Test St, City, Country',
      geometry: {
        location: {
          lat: 37.7749,
          lng: -122.4194
        }
      },
      formatted_phone_number: '+1 123-456-7890',
      website: 'https://example.com',
      price_level: 2,
      rating: 4.5,
      user_ratings_total: 100,
      opening_hours: {
        open_now: true,
        weekday_text: ['Monday: 9:00 AM – 10:00 PM', 'Tuesday: 9:00 AM – 10:00 PM']
      },
      photos: [
        {
          photo_reference: 'photo-reference-1',
          height: 400,
          width: 600
        },
        {
          photo_reference: 'photo-reference-2',
          height: 400,
          width: 600
        }
      ],
      types: ['restaurant', 'food']
    };
    
    test('should fetch place details correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          status: 'OK',
          result: mockPlaceDetails
        }
      });
      
      const service = new GooglePlacesService();
      const result = await service.getPlaceDetails('test-place-id');
      
      // Check axios was called with correct parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: 'test-place-id',
            fields: 'name,formatted_address,geometry,formatted_phone_number,website,price_level,rating,user_ratings_total,opening_hours,photos,types',
            key: 'test-api-key'
          }
        }
      );
      
      // Should include photo URLs in result
      expect(result?.photos_url).toHaveLength(2);
      expect(result?.photos_url?.[0]).toContain('photo-reference-1');
      expect(result?.name).toBe('Restaurant Name');
    });
    
    test('should handle place details without photos', async () => {
      const placeWithoutPhotos = { ...mockPlaceDetails };
      delete placeWithoutPhotos.photos;
      
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          status: 'OK',
          result: placeWithoutPhotos
        }
      });
      
      const service = new GooglePlacesService();
      const result = await service.getPlaceDetails('test-place-id');
      
      // Should not error when no photos are present
      expect(result?.name).toBe('Restaurant Name');
    });
    
    test('should throw error when API returns non-OK status', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          status: 'NOT_FOUND',
          result: {}
        }
      });
      
      const service = new GooglePlacesService();
      await expect(service.getPlaceDetails('invalid-id'))
        .rejects
        .toThrow('Failed to fetch place details');
        
      expect(console.error).toHaveBeenCalled;
    });
    
    test('should throw error when API request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      const service = new GooglePlacesService();
      await expect(service.getPlaceDetails('test-place-id'))
        .rejects
        .toThrow('Failed to fetch place details');
        
      expect(console.error).toHaveBeenCalled;
    });
  });
  
  describe('getPhotoUrl', () => {
    test('should generate correct photo URL', () => {
      const service = new GooglePlacesService();
      // Using any to access private method for testing
      const photoUrl = (service as any).getPhotoUrl('test-photo-reference', 400);
      
      expect(photoUrl).toBe('https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=test-photo-reference&key=test-api-key');
    });
  });
});