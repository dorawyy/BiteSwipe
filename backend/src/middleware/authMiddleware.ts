import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';

// Create a new OAuth client using your web client ID
// This should match the one used in the Android app
const CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

// Extend the Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Middleware to verify Google ID tokens
 * Extracts the token from the Authorization header and verifies it
 */
export const verifyGoogleToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the auth header
    const authHeader = req.headers.authorization;
    
    // If no auth header is present, return 401 Unauthorized
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No authorization header present'
      });
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Invalid authorization format, Bearer token required'
      });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    
    // Get the payload from the ticket
    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid token payload'
      });
    }
    
    // Extract user information
    const userId = payload.sub;
    const email = payload.email;
    
    // Add user info to the request object for use in route handlers
    req.userId = userId;
    req.userEmail = email;
    
    console.log(`Authenticated user: ${email}`);
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to require authentication
 * Use this for routes that should only be accessible to authenticated users
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
