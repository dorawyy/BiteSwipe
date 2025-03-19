import './unittest_setup';

import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../../middleware/validateRequest';
import { validationResult, ValidationError } from 'express-validator';

// Create a simplified mock of the Result class from express-validator
class MockResult {
  constructor(private readonly errors: ValidationError[] = []) {}

  isEmpty(): boolean {
    return this.errors.length === 0;
  }

  array(): ValidationError[] {
    return this.errors;
  }

  // Adding other required methods to satisfy the interface
  mapped(): Record<string, ValidationError> {
    return {};
  }

  formatWith<T>(formatter: (error: ValidationError) => T): any {
    return this;
  }

  throw(): void {}
}

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('validateRequest Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, and next function
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });
  
  test('should call next() when there are no validation errors', () => {
    // Create a mock result with no errors
    const mockResult = new MockResult([]);
    
    // Mock validationResult to return our mock result
    (validationResult as unknown as jest.Mock).mockReturnValue(mockResult);
    
    // Call the middleware
    validateRequest(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify next was called
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
  
  test('should return 400 status with errors when validation fails', () => {
    // Create mock validation errors that match the ValidationError interface
    const mockErrors: ValidationError[] = [
      { 
        type: 'field',
        msg: 'Invalid email format', 
        path: 'email',
        location: 'body',
        value: 'test'
      },
      { 
        type: 'field',
        msg: 'Password must be at least 6 characters', 
        path: 'password',
        location: 'body',
        value: 'test'
      }
    ];
    
    // Create a mock result with errors
    const mockResult = new MockResult(mockErrors);
    
    // Mock validationResult to return our mock result
    (validationResult as unknown as jest.Mock).mockReturnValue(mockResult);
    
    // Call the middleware
    validateRequest(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    // The middleware returns the first error message for most routes
    expect(mockResponse.json).toHaveBeenCalledWith({ error: mockErrors[0].msg });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  test('should return all errors for POST /users route', () => {
    // Create mock validation errors
    const mockErrors: ValidationError[] = [
      { 
        type: 'field',
        msg: 'Invalid email format', 
        path: 'email',
        location: 'body',
        value: 'test'
      },
      { 
        type: 'field',
        msg: 'Password must be at least 6 characters', 
        path: 'password',
        location: 'body',
        value: 'test'
      }
    ];
    
    // Create a mock result with errors
    const mockResult = new MockResult(mockErrors);
    
    // Mock validationResult to return our mock result
    (validationResult as unknown as jest.Mock).mockReturnValue(mockResult);
    
    // Setup request for POST /users route
    mockRequest = {
      method: 'POST',
      path: '/users'
    };
    
    // Call the middleware
    validateRequest(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verify response for POST /users route
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ errors: mockErrors });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
