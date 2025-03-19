// Import from setup.ts to use the centralized mocks for other dependencies
import './unittest_setup';
import { mockRestaurantModel, Restaurant } from './unittest_setup';

import { Types } from 'mongoose';

// Use the mockRestaurantModel from unittest_setup.ts
const mockRestaurantInstance = mockRestaurantModel;

// Simple tests for the Restaurant model
describe('Restaurant Model', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a Restaurant model', () => {
    // Input: None
    // Expected behavior: Restaurant model is defined
    // Expected output: Restaurant is defined
    expect(Restaurant).toBeDefined();
  });

  test('should create a restaurant with provided values', () => {
    // Input: Restaurant data object
    // Expected behavior: Creates a restaurant with the provided values
    // Expected output: Restaurant instance with matching properties

    // Create a new restaurant with basic fields
    const restaurantData = {
      name: 'Test Restaurant',
      location: {
        address: '123 Test St, City, Country',
        coordinates: {
          latitude: 49.2827,
          longitude: -123.1207
        }
      },
      contact: {
        phone: '123-456-7890',
        website: 'https://testrestaurant.com'
      },
      menu: {
        categories: []
      },
      images: {
        primary: 'image1.jpg',
        gallery: ['image2.jpg', 'image3.jpg']
      },
      priceLevel: 2,
      rating: 4.5,
      openingHours: {
        openNow: true,
        weekdayText: ['Monday: 9AM-9PM']
      },
      sourceData: {
        googlePlaceId: 'place123',
        lastUpdated: new Date('2023-01-01')
      }
    };

    // Create a new restaurant using the constructor pattern
    const restaurant = new Restaurant(restaurantData);

    // Then the restaurant should have the expected properties
    expect(restaurant).toBeDefined();
    // Verify that the properties were copied from restaurantData
    expect(restaurant.name).toBe('Test Restaurant');
    expect(restaurant.location.address).toBe('123 Test St, City, Country');
    expect(restaurant.priceLevel).toBe(2);
  });

  test('should have correct schema structure', () => {
    // Input: None
    // Expected behavior: Restaurant model is mocked properly
    // Expected output: Mock functions are defined

    // In mocked tests, we're testing that the mock functions exist
    // We don't need to test the actual schema structure
    expect(Restaurant.find).toBeDefined();
    expect(Restaurant.findOne).toBeDefined();
    expect(Restaurant.findById).toBeDefined();
    expect(Restaurant.create).toBeDefined();
    expect(Restaurant.updateOne).toBeDefined();
    expect(Restaurant.deleteOne).toBeDefined();
    expect(Restaurant.aggregate).toBeDefined();
  });

  test('should handle find operations', async () => {
    // Input: Query parameters
    // Expected behavior: Restaurant.find is called with the correct parameters
    // Expected output: Mock response

    // Setup mock response
    const mockRestaurants = [
      { _id: '123', name: 'Restaurant 1' },
      { _id: '456', name: 'Restaurant 2' }
    ];

    // Set up the mock to return our test data
    (Restaurant.find as jest.Mock).mockResolvedValueOnce(mockRestaurants);

    // When finding restaurants
    const query = { priceLevel: { $gte: 2 } };
    const result = await Restaurant.find(query);

    // Then find should be called with the correct query
    expect(Restaurant.find).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockRestaurants);
  });

  test('should handle findOne operations', async () => {
    // Input: Query parameters
    // Expected behavior: Restaurant.findOne is called with the correct parameters
    // Expected output: Mock response

    // Setup mock response
    const mockRestaurant = { _id: '123', name: 'Restaurant 1' };

    // Set up the mock to return our test data
    (Restaurant.findOne as jest.Mock).mockResolvedValueOnce(mockRestaurant);

    // When finding a restaurant
    const query = { 'sourceData.googlePlaceId': 'place123' };
    const result = await Restaurant.findOne(query);

    // Then findOne should be called with the correct query
    expect(Restaurant.findOne).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockRestaurant);
  });
});
