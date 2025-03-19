import { UserController } from '../controllers/userController';
import { body, param, ValidationChain } from 'express-validator';
import { SessionManager } from '../services/sessionManager';
import { UserService } from '../services/userService';
import express from 'express';

export const userRoutes = (userService: UserService, sessionManager: SessionManager) => {
    const userController = new UserController(userService, sessionManager);

    // Define interfaces for route definitions
    interface RouteDefinition {
        method: 'get' | 'post' | 'put' | 'delete' | 'patch';
        route: string;
        action: (req: express.Request, res: express.Response, next: express.NextFunction) => void | Promise<void>;
        validation: ValidationChain[];
    }

    return [
            {
                    method: 'get' as const,
                    route: '/users/:userId',
                    action: (req: express.Request, res: express.Response) => userController.getUser(req, res),
                    validation: [
                            param('userId').notEmpty().withMessage('User ID is required')
                    ]
            },
            {
                    method: 'post' as const,
                    route: '/users',
                    action: (req: express.Request, res: express.Response) => userController.createUser(req, res),
                    validation: [
                            body('email').isEmail().withMessage('Valid email is required'),
                            body('displayName').notEmpty().withMessage('Display name is required')
                    ]
            },
            {
                    method: 'post' as const,
                    route: '/users/:userId/fcm-token',
                    action: (req: express.Request, res: express.Response) => userController.updateFCMToken(req, res),
                    validation: [
                            param('userId').notEmpty().withMessage('User ID is required'),
                            body('fcmToken').notEmpty().withMessage('FCM token is required')
                    ]
            },
            {
                    method: 'get' as const,
                    route: '/users/:userId/sessions',
                    action: (req: express.Request, res: express.Response) => userController.getUserSessions(req, res),
                    validation: [
                            param('userId').notEmpty().withMessage('User ID is required')
                    ]
            },
            {
                    method: 'get' as const,
                    route: '/users/emails/:email',
                    action: (req: express.Request, res: express.Response) => userController.getUserByEmail(req, res),
                    validation: [
                            param('email').isEmail().withMessage('Valid email is required')
                    ]
            }
    ] as RouteDefinition[];
};