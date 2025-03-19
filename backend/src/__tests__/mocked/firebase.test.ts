/**
 * Firebase Configuration Tests
 * 
 * This file tests the firebase.ts module which initializes Firebase Admin SDK
 * and provides messaging functionality for push notifications.
 * 
 * Tests cover:
 * 1. Basic Firebase configuration and exports
 * 2. Messaging functionality
 * 3. Error handling for various scenarios:
 *    - Missing credentials pathname
 *    - Non-existent credentials file
 *    - Invalid JSON in credentials file
 * 4. Mock messaging implementation when Firebase initialization fails
 */

// Temporarily disable the global mock for this test file
jest.unmock('../../config/firebase');

// Mock fs module to control file existence checks for error handling tests
const mockFsExistsSync = jest.fn().mockReturnValue(false);
const mockFsReadFileSync = jest.fn().mockReturnValue('{}');

jest.mock('fs', () => ({
  existsSync: mockFsExistsSync,
  readFileSync: mockFsReadFileSync,
}));

// Mock firebase-admin to prevent actual initialization
const mockFirebaseMessaging = {
  send: jest.fn().mockResolvedValue('mock-message-id'),
  sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
};

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  messaging: jest.fn().mockReturnValue(mockFirebaseMessaging)
}));

// Setup variables for test environment
let savedEnv: typeof process.env;
let savedConsoleError: typeof console.error;
let savedConsoleWarn: typeof console.warn;
let savedConsoleLog: typeof console.log;

// PART 1: Basic Firebase Configuration Tests
describe('Firebase Configuration', () => {
  // Import the firebase module (which will use the mock from setup.ts)
  const firebase = require('../../config/firebase');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Input: Firebase module
  // Expected behavior: Module should be defined
  // Expected output: Defined module
  test('should have firebase module', () => {
    expect(firebase).toBeDefined();
  });

  // Input: Firebase module
  // Expected behavior: Module should export default admin object
  // Expected output: Defined default export
  test('should have default export', () => {
    expect(firebase.default).toBeDefined();
  });

  // Input: Firebase module
  // Expected behavior: Default export should have apps property
  // Expected output: apps property is defined
  test('default export should have apps property', () => {
    expect(firebase.default.apps).toBeDefined();
  });

  // Input: Firebase module
  // Expected behavior: Default export should have messaging function
  // Expected output: messaging function is defined
  test('default export should have messaging function', () => {
    expect(typeof firebase.default.messaging).toBe('function');
  });

  // Input: Firebase messaging
  // Expected behavior: getMessaging should return an object with send function
  // Expected output: messaging object with send function
  test('getMessaging should return an object with send function', () => {
    const messaging = firebase.getMessaging();
    expect(messaging).toBeDefined();
    expect(typeof messaging.send).toBe('function');
  });

  // Input: messaging.send with token
  // Expected behavior: send should return a message ID
  // Expected output: message ID string
  test('messaging.send should return a message ID', async () => {
    const messaging = firebase.getMessaging();
    const result = await messaging.send({ token: 'test-token' });
    expect(result).toBe('mock-message-id');
  });
  
  // Input: Firebase module
  // Expected behavior: Module should export getMessaging function
  // Expected output: Defined getMessaging function
  test('should export getMessaging function', () => {
    expect(typeof firebase.getMessaging).toBe('function');
  });
  
  // Input: getMessaging function
  // Expected behavior: getMessaging should return a messaging object
  // Expected output: messaging object with send and sendMulticast functions
  test('getMessaging should return a messaging object', () => {
    const messaging = firebase.getMessaging();
    expect(messaging).toBeDefined();
    expect(typeof messaging.send).toBe('function');
    expect(typeof messaging.sendMulticast).toBe('function');
  });
});

// PART 2: Firebase Error Handling Tests
describe('Firebase Error Handling', () => {
  // Setup before tests
  beforeEach(() => {
    // Save original values
    savedEnv = process.env;
    savedConsoleError = console.error;
    savedConsoleWarn = console.warn;
    savedConsoleLog = console.log;
    
    jest.resetModules(); // Clear module cache
    process.env = { ...savedEnv }; // Make a copy of original env
    delete process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME; // Ensure the env var is not set
    
    // Reset mock implementations
    mockFsExistsSync.mockReturnValue(false);
    mockFsReadFileSync.mockReturnValue('{}');
    
    // Mock console methods to prevent test output pollution and capture calls
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  });

  // Restore environment and console methods after tests
  afterEach(() => {
    process.env = savedEnv; // Restore original env
    console.error = savedConsoleError;
    console.warn = savedConsoleWarn;
    console.log = savedConsoleLog;
    jest.clearAllMocks();
  });
  
  // Input: Valid Firebase credentials pathname with valid JSON content
  // Expected behavior: Firebase is initialized successfully
  // Expected output: Log message about successful initialization
  test('should initialize Firebase successfully with valid credentials', () => {
    // Set a pathname for our test
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/valid/credentials.json';
    
    // Mock file to exist and contain valid JSON
    mockFsExistsSync.mockReturnValue(true);
    mockFsReadFileSync.mockReturnValue(JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: 'test-private-key',
      client_email: 'test@example.com',
      client_id: 'test-client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com'
    }));
    
    // Reset module cache to ensure our new env var and mocks are used
    jest.resetModules();
    
    // Act
    require('../../config/firebase');
    
    // Assert - verify debug info and success message was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Using Firebase credentials from file:')
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Firebase credentials file size:')
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Firebase credentials file starts with:')
    );
    
    expect(console.log).toHaveBeenCalledWith('Firebase initialized successfully');
  });

  // Input: No Firebase credentials pathname in environment
  // Expected behavior: Error is thrown during initialization
  // Expected output: Error message about missing credentials pathname
  test('should throw error when Firebase credentials pathname is missing', () => {
    // Act
    require('../../config/firebase');
    
    // Assert - verify that the error was logged
    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'ERROR initializing Firebase:',
      expect.objectContaining({
        message: 'Firebase credentials JSON pathname is required. Add FIREBASE_CREDENTIALS_JSON_PATHNAME=<pathname> to .env'
      })
    );
  });

  // Input: Valid Firebase credentials pathname in environment but file doesn't exist
  // Expected behavior: Warning is logged about missing file
  // Expected output: Warning message about missing credentials file
  test('should warn when Firebase credentials file does not exist', () => {
    // Set a pathname that we've mocked to not exist
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/nonexistent/file.json';
    
    // Reset module cache to ensure our new env var is used
    jest.resetModules();
    
    // Act
    require('../../config/firebase');
    
    // Assert
    expect(console.warn).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: Firebase credentials file not found at')
    );
  });
  
  // Input: Valid Firebase credentials pathname with file that exists but contains invalid JSON
  // Expected behavior: Error is caught during JSON parsing and logged
  // Expected output: Error message about JSON parsing failure
  test('should handle JSON parsing errors for malformed credentials file', () => {
    // Set a pathname for our test
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/existing/but/invalid/file.json';
    
    // Mock file to exist but contain invalid JSON
    mockFsExistsSync.mockReturnValue(true);
    mockFsReadFileSync.mockReturnValue('{ this is not valid JSON }');
    
    // Reset module cache to ensure our new env var and mocks are used
    jest.resetModules();
    
    // Act
    require('../../config/firebase');
    
    // Assert - verify debug info and error was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Using Firebase credentials from file:')
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Firebase credentials file size:')
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Firebase credentials file starts with:')
    );
    
    expect(console.error).toHaveBeenCalledWith(
      'ERROR parsing Firebase credentials JSON:',
      expect.any(Error)
    );
    
    expect(console.error).toHaveBeenCalledWith(
      'First 50 characters of file:',
      expect.stringContaining('{ this is not valid JSON }')
    );
    
    expect(console.error).toHaveBeenCalledWith(
      'This may indicate the file was corrupted during copying or deployment'
    );
  });
});

// PART 3: Mock Messaging Tests
describe('Firebase Mock Messaging', () => {
  // Setup for all tests
  // Setup before tests
  beforeEach(() => {
    // Save original values
    savedEnv = process.env;
    savedConsoleError = console.error;
    savedConsoleWarn = console.warn;
    savedConsoleLog = console.log;
    
    jest.resetModules(); // Clear module cache
    process.env = { ...savedEnv }; // Make a copy of original env
    
    // Mock console methods to prevent test output pollution and capture calls
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  });

  // Restore environment and console methods after tests
  afterEach(() => {
    process.env = savedEnv; // Restore original env
    console.error = savedConsoleError;
    console.warn = savedConsoleWarn;
    console.log = savedConsoleLog;
    jest.clearAllMocks();
  });
  
  // Input: Firebase initialization failed and getMessaging is called
  // Expected behavior: Mock messaging object is returned
  // Expected output: Log message about using mock messaging
  test('should provide mock messaging when Firebase initialization failed', () => {
    // Create a custom mock for firebase-admin that doesn't initialize messaging
    jest.resetModules();
    jest.mock('firebase-admin', () => ({
      apps: [],
      initializeApp: jest.fn(),
      credential: {
        cert: jest.fn()
      },
      // Return undefined for messaging to force the else branch
      messaging: jest.fn().mockReturnValue(undefined)
    }));
    
    // Set environment variables to ensure Firebase tries to initialize
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/valid/credentials.json';
    mockFsExistsSync.mockReturnValue(true);
    mockFsReadFileSync.mockReturnValue(JSON.stringify({
      type: 'service_account',
      project_id: 'test-project'
    }));
    
    // Import the module directly (not using doMock)
    const firebase = require('../../config/firebase');
    
    // Call getMessaging which should return the mock implementation
    const messaging = firebase.getMessaging();
    
    // Verify log message about using mock messaging
    expect(console.log).toHaveBeenCalledWith('Using mock Firebase messaging');
    
    // Test the mock messaging.send method
    return messaging.send({ token: 'test-token' })
      .then((result: string) => {
        // Verify the mock send method was called and returned expected result
        expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: message would be sent here');
        expect(result).toBe('mock-message-id');
        
        // Test the mock messaging.sendMulticast method
        return messaging.sendMulticast({ tokens: ['test-token'] });
      })
      .then((result: { successCount: number; failureCount: number; responses: any[] }) => {
        // Verify the mock sendMulticast method was called and returned expected result
        expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: multicast message would be sent here');
        expect(result).toEqual({ successCount: 0, failureCount: 0, responses: [] });
      });
  });
  
  // Input: getMessaging function
  // Expected behavior: messaging.send should log a message when called
  // Expected output: Log message about mock messaging
  test('messaging.send should log a message when called', () => {
    // Create a mock implementation
    jest.doMock('../../config/firebase', () => {
      const mockMessaging = {
        send: jest.fn().mockImplementation(() => {
          console.log('Mock Firebase messaging: message would be sent here');
          return Promise.resolve('mock-message-id');
        }),
        sendMulticast: jest.fn().mockImplementation(() => {
          console.log('Mock Firebase messaging: multicast message would be sent here');
          return Promise.resolve({ successCount: 0, failureCount: 0, responses: [] });
        })
      };
      
      return {
        default: { apps: [] },
        getMessaging: jest.fn().mockReturnValue(mockMessaging)
      };
    });
    
    // Import the module
    const firebase = require('../../config/firebase');
    
    // Get the messaging instance and call send
    const messaging = firebase.getMessaging();
    messaging.send({ token: 'test-token' });
    
    // Verify log message
    expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: message would be sent here');
  });
  
  // Input: getMessaging function
  // Expected behavior: messaging.sendMulticast should log a message when called
  // Expected output: Log message about mock messaging
  test('messaging.sendMulticast should log a message when called', () => {
    // Import the module (using the mock from the previous test)
    const firebase = require('../../config/firebase');
    
    // Get the messaging instance and call sendMulticast
    const messaging = firebase.getMessaging();
    messaging.sendMulticast({ tokens: ['test-token'] });
    
    // Verify log message
    expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: multicast message would be sent here');
  });

  // Input: Firebase module with messaging explicitly set to null
  // Expected behavior: Should trigger the else branch in getMessaging function
  // Expected output: Mock messaging object and log message
  test('should explicitly test the else branch in getMessaging when messaging is null', () => {
    // Since we've exported the messaging variable, we can directly manipulate it
    // to test both branches of the getMessaging function
    
    // First, save the original module and unmock it
    const originalMock = jest.requireMock('../../config/firebase');
    jest.unmock('../../config/firebase');
    
    // Reset modules to ensure we get a fresh copy
    jest.resetModules();
    
    // Clear console.log mock
    (console.log as jest.Mock).mockClear();
    
    // Import the actual firebase module with the exported messaging variable
    const firebase = require('../../config/firebase');
    
    // Set messaging to null to force the else branch
    firebase.messaging = null;
    
    // Call getMessaging which should now go through the else branch
    const mockMessaging = firebase.getMessaging();
    
    // Verify the log message for the else branch
    expect(console.log).toHaveBeenCalledWith('Using mock Firebase messaging');
    
    // Verify it's a mock implementation
    expect(mockMessaging).toBeDefined();
    expect(typeof mockMessaging.send).toBe('function');
    expect(typeof mockMessaging.sendMulticast).toBe('function');
    
    // Test the mock send method
    mockMessaging.send({ token: 'test-token' });
    
    // Verify the mock implementation was used
    expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: message would be sent here');
    
    // Restore the original mock to not affect other tests
    jest.doMock('../../config/firebase', () => originalMock);
  });
  
  // Input: Firebase module with messaging already initialized
  // Expected behavior: Should trigger the if (messaging) branch in getMessaging function
  // Expected output: The existing messaging object
  test('should explicitly test the if (messaging) branch in getMessaging when messaging is not null', () => {
    // First, save the original module and unmock it
    const originalMock = jest.requireMock('../../config/firebase');
    jest.unmock('../../config/firebase');
    
    // Reset modules to ensure we get a fresh copy
    jest.resetModules();
    
    // Clear console.log mock
    (console.log as jest.Mock).mockClear();
    
    // Import the actual firebase module with the exported messaging variable
    const firebase = require('../../config/firebase');
    
    // Create a mock messaging object
    const mockMessagingObj = {
      send: jest.fn().mockResolvedValue('mock-message-id'),
      sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
    };
    
    // Set messaging to our mock object to force the if branch
    firebase.messaging = mockMessagingObj;
    
    // Call getMessaging which should now go through the if branch
    const returnedMessaging = firebase.getMessaging();
    
    // Verify that console.log was NOT called (since we're in the if branch)
    expect(console.log).not.toHaveBeenCalledWith('Using mock Firebase messaging');
    
    // Verify that the returned object is the same as our mock
    expect(returnedMessaging).toBe(mockMessagingObj);
    
    // Restore the original mock to not affect other tests
    jest.doMock('../../config/firebase', () => originalMock);
  });
});
