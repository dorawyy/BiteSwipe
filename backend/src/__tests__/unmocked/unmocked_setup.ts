import mongoose from "mongoose";
import { config } from "dotenv";
import path from "path";
import { beforeAll, afterAll } from "@jest/globals";

// Load test environment variables
config({ path: path.join(__dirname, "../../../.env") });

// Set environment variables for test mode
process.env.NODE_ENV = 'test';
process.env.TEST_TYPE = 'unmocked';

// Configure mongoose
mongoose.set('strictQuery', false);

// Validate and fix DB_URI
if (!process.env.DB_URI) {
    throw new Error("DB_URI environment variable is not set");
}


// Generate a random 5-character hash
const randomHash = Math.random().toString(36).substring(2, 7);

// Create test database URI with random hash and preserve query parameters
const testDbUri = process.env.DB_URI + `_test_${randomHash}`;

// Connect to MongoDB before tests run
beforeAll(async () => {
    try {
        await mongoose.connect(testDbUri);
        //console.log('Connected to test database:', testDbUri);
        // Update DB_URI with test database URI
        process.env.DB_URI = testDbUri;
    } catch (error) {
        console.error('Error connecting to test database:', error);
        throw error;
    }
});

// Disconnect from MongoDB after tests complete
afterAll(async () => {
    try {
        await mongoose.connection.close();
        //console.log('Disconnected from test database');
    } catch (error) {
        console.error('Error disconnecting from test database:', error);
    }
});
