import { config } from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

// Check if .env file exists and load it
const envPath = path.join(__dirname, "../../.env");
if (!fs.existsSync(envPath)) {
  throw new Error(
    "ERROR: .env file not found at: " +
      envPath +
      "\nPlease create a .env file in the backend directory with the required environment variables."
  );
}

// Load environment variables
const result = config({ path: envPath });
if (result.error) {
  throw new Error(
    "ERROR: Failed to load environment variables from .env file: " +
      result.error.message
  );
}

// Set environment variables for test mode
process.env.NODE_ENV = 'test';

// Validate required environment variables
const requiredEnvVars = [
  "DB_URI",
  "PORT",
  "GOOGLE_MAPS_API_KEY",
  "FIREBASE_CREDENTIALS_JSON_PATHNAME",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `ERROR: Required environment variable ${envVar} is not set in .env file`
    );
  }
}

// Mock User Model for tests
export const mockUserModel = {
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

// Mock Restaurant Service for tests
export const mockRestaurantService = {
  getRestaurantById: jest.fn(),
  getRestaurant: jest.fn(), // Alias for getRestaurantById used in tests
  getRestaurants: jest.fn(), // Method to get multiple restaurants
  searchRestaurants: jest.fn(),
  getRestaurantDetails: jest.fn(),
};

// Only mock ObjectId for mocked tests, not for unmocked tests
// This is to avoid interfering with the real MongoDB connection in unmocked tests
if (process.env.NODE_ENV === 'test' && process.env.TEST_TYPE === 'mocked') {
  // Create a simple string-based mock for ObjectId that works with the mocked tests
  
  // Store the original implementation for reference
  const mockObjectId = function(id?: string) {
    if (id) return id;
    return 'mock-id-' + Math.random().toString(36).substring(2, 15);
  } as any;
  
  // Add required static methods
  mockObjectId.createFromHexString = jest.fn().mockImplementation((hex) => hex);
  mockObjectId.createFromTime = jest.fn().mockImplementation((time) => `time-${time}`);
  mockObjectId.generate = jest.fn().mockImplementation(() => 'generated-id');
  mockObjectId.isValid = jest.fn().mockImplementation((id) => {
    if (typeof id === 'string') return id.length === 24 || id.length === 12;
    return false;
  });
  mockObjectId.cacheHexString = true;
  
  // For toString() method on instances
  mockObjectId.prototype = {
    toString: function() { return this; }
  };
  
  // Only apply the mock for mocked tests
  mongoose.Types.ObjectId = mockObjectId;
}

