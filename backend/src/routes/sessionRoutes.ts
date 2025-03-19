import { SessionController } from '../controllers/sessionController';
import { SessionManager } from '../services/sessionManager';
import { UserService } from '../services/userService';
import { body, param, ValidationChain } from 'express-validator';
import express from 'express';

export const sessionRoutes = (sessionManager: SessionManager, userService: UserService) => {
    const sessionController = new SessionController(sessionManager, userService);

    // Define interface for route definitions
    interface RouteDefinition {
        method: 'get' | 'post' | 'put' | 'delete' | 'patch';
        route: string;
        action: (req: express.Request, res: express.Response, next?: express.NextFunction) => void | Promise<void>;
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
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions',
            action: (req: express.Request, res: express.Response) => sessionController.createSession(req, res),
            validation: [
                body('userId').notEmpty().withMessage('User ID is required'),
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
                param('sessionId').notEmpty().withMessage('Session ID is required'),
                body('email').notEmpty().withMessage('Email is required')
            ]
        },
        {
            method: 'delete' as const,
            route: '/sessions/:sessionId/invitations/:userId',
            action: (req: express.Request, res: express.Response) => sessionController.rejectInvitation(req, res),
            validation: [
                param('sessionId').notEmpty().withMessage('Session ID is required'),
                param('userId').notEmpty().withMessage('User ID is required')
            ]
        },
        {
            method: 'delete' as const,
            route: '/sessions/:sessionId/participants/:userId',
            action: (req: express.Request, res: express.Response) => sessionController.leaveSession(req, res),
            validation: [
                param('userId').notEmpty().withMessage('User ID is required'),
                param('sessionId').notEmpty().withMessage('Session ID is required')
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:joinCode/participants',
            action: (req: express.Request, res: express.Response) => sessionController.joinSession(req, res),
            validation: [
                param('joinCode').notEmpty().withMessage('Session ID is required'),
                body('userId').notEmpty().withMessage('User ID is required')
            ]
        },
        {
            method: 'get' as const,
            route: '/sessions/:sessionId/restaurants',
            action: (req: express.Request, res: express.Response) => sessionController.getRestaurantsInSession(req, res),
            validation: [
                param('sessionId').notEmpty().withMessage('Session ID is required')
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:sessionId/votes',
            action: (req: express.Request, res: express.Response) => sessionController.sessionSwiped(req, res),
            validation: [
                param('sessionId').notEmpty().withMessage('Session ID is required'),
                body('restaurantId').notEmpty().withMessage('Restaurant ID is required'),
                body('liked').isBoolean().withMessage('Liked must be a boolean')
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:sessionId/start',
            action: (req: express.Request, res: express.Response) => sessionController.startSession(req, res),
            validation: [
                param('sessionId').notEmpty().withMessage('Session ID is required')
            ]
        },
        {
            method: 'post' as const,
            route: '/sessions/:sessionId/doneSwiping',
            action: (req: express.Request, res: express.Response) => sessionController.userDoneSwiping(req, res),
            validation: [
                param('sessionId').notEmpty().withMessage('Session ID is required'),
                body('userId').notEmpty().withMessage('User ID is required')
            ]
        },
        {
            method: 'get' as const,
            route: '/sessions/:sessionId/result',
            action: (req: express.Request, res: express.Response) => sessionController.getResultForSession(req, res),
            validation: [
                param('sessionId').notEmpty().withMessage('Session ID is required')
            ]
        }
    ] as RouteDefinition[];
};