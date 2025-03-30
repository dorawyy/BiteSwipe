import { SessionController } from '../controllers/sessionController';
import { SessionManager } from '../services/sessionManager';
import { UserService } from '../services/userService';
import { body, param, CustomValidator, ValidationChain} from 'express-validator';
import { Types } from 'mongoose';
import * as express from 'express';


// Reusable validator functions
const isValidObjectId: CustomValidator = (value: string ) => {
    if (!Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
    }
    return true;
};

const isValidSessionId: CustomValidator = (value: string) => {
    if (!Types.ObjectId.isValid(value)) {
        throw new Error('Invalid session ID format');
    }
    return true;
};

const validateUserIdBody = () => body('userId')
    .notEmpty().withMessage('User ID is required')
    .custom(isValidObjectId).withMessage('Invalid user ID format');

const validateSessionIdParam = () => param('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .custom(isValidSessionId).withMessage('Invalid session ID format');

const validateUserIdParam = () => param('userId')
    .notEmpty().withMessage('User ID is required')
    .custom(isValidObjectId).withMessage('Invalid user ID format');

export const sessionRoutes = (sessionManager: SessionManager, userService: UserService) => {
    const sessionController = new SessionController(sessionManager, userService);

    // Define interface for route definitions
    interface RouteDefinition {
        method: 'get' | 'post' | 'put' | 'delete' | 'patch';
        route: string;
        action: (req: express.Request, res: express.Response, next?: express.NextFunction) => Promise<unknown>;
        validation: ValidationChain[];
    }

    return [
        {
            method: 'get' as const,
            route: '/sessions/:sessionId',
            action: (req: express.Request, res: express.Response) => sessionController.getSession(req, res),
            validation: [
                param('sessionId').exists().withMessage('Session ID is required')
                    .notEmpty().withMessage('Session ID cannot be empty')
                    .custom(isValidSessionId)
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions',
            action: (req: express.Request, res: express.Response) => sessionController.createSession(req, res),
            validation: [
                validateUserIdBody(),
                body('latitude').isNumeric().withMessage('Latitude must be a number'),
                body('longitude').isNumeric().withMessage('Longitude must be a number'),
                body('radius').isNumeric().withMessage('Radius must be a number')
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:sessionId/invitations',
            action: (req: express.Request, res: express.Response) => sessionController.inviteUser(req, res),
            validation: [
                validateSessionIdParam(),
                body('email').notEmpty().withMessage('Email is required')
            ]
        },
        {
            method: 'delete' as const,
            route: '/sessions/:sessionId/invitations/:userId',
            action: (req: express.Request, res: express.Response) => sessionController.rejectInvitation(req, res),
            validation: [
                validateSessionIdParam(),
                validateUserIdParam()
            ]
        },
        {
            method: 'delete' as const,
            route: '/sessions/:sessionId/participants/:userId',
            action: (req: express.Request, res: express.Response) => sessionController.leaveSession(req, res),
            validation: [
                validateSessionIdParam(),
                validateUserIdParam()
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:joinCode/participants',
            action: (req: express.Request, res: express.Response) => sessionController.joinSession(req, res),
            validation: [
                param('joinCode').notEmpty().withMessage('Join code is required'),
                validateUserIdBody()
            ]
        },
        {
            method: 'get' as const,
            route: '/sessions/:sessionId/restaurants',
            action: (req: express.Request, res: express.Response) => sessionController.getRestaurantsInSession(req, res),
            validation: [
                validateSessionIdParam()
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:sessionId/votes',
            action: (req: express.Request, res: express.Response) => sessionController.sessionSwiped(req, res),
            validation: [
                validateSessionIdParam(),
                body('restaurantId').notEmpty().withMessage('Restaurant ID is required'),
                body('liked').isBoolean().withMessage('Liked must be a boolean')
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:sessionId/start',
            action: (req: express.Request, res: express.Response) => sessionController.startSession(req, res),
            validation: [
                validateSessionIdParam(),
                validateUserIdBody(),
                body('time').isNumeric().withMessage('Time must be a number')
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:sessionId/doneSwiping',
            action: (req: express.Request, res: express.Response) => sessionController.userDoneSwiping(req, res),
            validation: [
                validateSessionIdParam(),
                validateUserIdBody()
            ]
        },
        {
            method: 'get' as const,
            route: '/sessions/:sessionId/result',
            action: (req: express.Request, res: express.Response) => sessionController.getResultForSession(req, res),
            validation: [
                validateSessionIdParam()
            ]
        },
        {
            method: 'get' as const,
            route: '/sessions/:sessionId/potentialMatch',
            action: (req: express.Request, res: express.Response) => sessionController.getPotentialMatch(req, res),
            validation: [
                validateSessionIdParam(),
            ]
        },
        {
            method: 'get' as const,
            route: '/sessions/:sessionId/sessionStatus',
            action: (req: express.Request, res: express.Response) => sessionController.getSessionStatus(req, res),
            validation: [
                validateSessionIdParam(),
            ]
        },
        // route have to add 
        {
            method: 'get' as const,
            route: '/sessions/:sessionId/potentialMatchResult',
            action: (req: express.Request, res: express.Response) => sessionController.getPotentialMatchResult(req, res),
            validation: [
                validateSessionIdParam()
            ]
        }, 
        {
            method: 'post' as const,
            route: '/sessions/:sessionId/potentialMatchSwipe',
            action: (req: express.Request, res: express.Response) => sessionController.potentialMatchSwiped(req, res),
            validation: [
                validateSessionIdParam()
            ]
        }
    ] as RouteDefinition[];
};