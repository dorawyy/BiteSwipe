import { UserController } from '../controllers/userController';
import { body, param, CustomValidator, ValidationChain } from 'express-validator';
import { SessionManager } from '../services/sessionManager';
import { UserService } from '../services/userService';
import { Types } from 'mongoose';
import * as express from 'express';

// Reusable validator functions
const isValidObjectId: CustomValidator = (value: string) => {
    if (!Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
    }
    return true;
};

const validateUserIdParam = () => param('userId')
    .notEmpty().withMessage('User ID is required')
    .custom(isValidObjectId).withMessage('Invalid user ID format');

export const userRoutes = (userService: UserService, sessionManager: SessionManager) => {
    const userController = new UserController(userService, sessionManager);

    // Define interfaces for route definitions
    interface RouteDefinition {
        method: 'get' | 'post' | 'put' | 'delete' | 'patch';
        route: string;
        action: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>;
        validation: ValidationChain[];
    }

    return [
        {
            method: 'get' as const,
            route: '/users/:userId',
            action: (req: express.Request, res: express.Response) => userController.getUser(req, res),
            validation: [
                validateUserIdParam()
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
                validateUserIdParam(),
                body('fcmToken').notEmpty().withMessage('FCM token is required')
            ]
        },
        {
            method: "post" as const,
            route: '/users/:userId/updateDisplayName',
            action: (req: express.Request, res: express.Response) => userController.updateDisplayName(req, res),
            validation: [
                validateUserIdParam(),
                body('displayName').notEmpty().withMessage('displayName value is required')
            ]
        },
        {
            method: 'get' as const,
            route: '/users/:userId/sessions',
            action: (req: express.Request, res: express.Response) => userController.getUserSessions(req, res),
            validation: [
                validateUserIdParam()
            ]
        },
        {
            method: 'get' as const,
            route: '/users/emails/:email',
            action: (req: express.Request, res: express.Response) => userController.getUserByEmail(req, res),
            validation: [
                param('email').isEmail().withMessage('Valid email is required')
            ]
        },
        {
            method: 'post' as const,
            route: '/users/:email/friendRequest',
            action: (req: express.Request, res: express.Response) => userController.sendFriendRequest(req,res),
            validation: [
                body('friendEmail').notEmpty().withMessage('Friend ID is required')
            ]
        },
        {
            method: 'post' as const,
            route: '/users/:email/acceptRequest',
            action: (req: express.Request, res: express.Response) => userController.acceptFriendRequest(req, res),
            validation: [
                body('friendEmail').notEmpty().withMessage('Friend ID is required')
            ]
        },
        {
            method: 'post' as const,
            route: '/users/:email/rejectRequest',
            action: (req: express.Request, res: express.Response) => userController.rejectFriendRequest(req, res),
            validation: [
                body('friendEmail').notEmpty().withMessage('Friend ID is required')
            ]
        },
        {
            method: 'delete' as const,
            route: '/users/:email/removeFriend',
            action: (req: express.Request, res: express.Response) => userController.removeFriend(req, res),
            validation: [
                body('friendEmail').notEmpty().withMessage('Friend ID is required')
            ]
        }
    ] as RouteDefinition[];
};