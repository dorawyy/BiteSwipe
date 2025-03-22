import { Request, Response } from 'express';
import { SessionManager } from '../services/sessionManager';
// import { NotificationService } from '../services/notificationService';
import { MongoDocument } from '../models/appTypes';
import { UserService } from '../services/userService';
import { ObjectId } from 'mongoose';

interface CodedError extends Error {
    code?: string;
}


export class SessionController {
    private sessionManager: SessionManager;
    // private notificationService: NotificationService;
    private userService: UserService;

    constructor(sessionManager: SessionManager, userService: UserService) {
        this.sessionManager = sessionManager;
        // this.notificationService = new NotificationService();
        this.userService = userService;

        // Bind methods
        this.getSession = this.getSession.bind(this);
        this.createSession = this.createSession.bind(this);
        this.inviteUser = this.inviteUser.bind(this);
        this.joinSession = this.joinSession.bind(this);

        this.getRestaurantsInSession = this.getRestaurantsInSession.bind(this);
        this.sessionSwiped = this.sessionSwiped.bind(this);
        this.startSession = this.startSession.bind(this);

        this.rejectInvitation = this.rejectInvitation.bind(this);
        this.leaveSession = this.leaveSession.bind(this);

        this.getResultForSession = this.getResultForSession.bind(this);
        this.userDoneSwiping = this.userDoneSwiping.bind(this);

    }

    async getSession(req: Request, res: Response) {
        try {
            const sessionId = req.params.sessionId;
            const session = await this.sessionManager.getSession(sessionId) as unknown as MongoDocument;
            // if (!session) {
            //     return res.status(404).json({ error: 'Session not found' });
            // }
            res.status(200).json(session);
        } catch (error: unknown) {
            console.error('Error fetching session:', error);

            if ((error as CodedError).message === 'Invalid session ID format') {
                return res.status(400).json({ error: 'Invalid session ID format' });
            } else if ((error as CodedError).code === 'SESSION_NOT_FOUND') {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createSession(req: Request, res: Response) {
        try {
            const { userId, latitude, longitude, radius } = req.body as {
                userId: string,
                latitude: string | number,
                longitude: string | number,
                radius: string | number;
            };

            // Check for missing required parameters
            // if (latitude === undefined || longitude === undefined || radius === undefined) {
            //     return res.status(400).json({ error: 'Missing required location parameters' });
            // }

            // Convert coordinates to numbers
            const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
            const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
            const rad = typeof radius === 'string' ? parseFloat(radius) : radius;

            // Validate coordinates
            if (isNaN(lat) || lat < -90 || lat > 90) {
                return res.status(400).json({ error: 'Invalid latitude value' });
            }
            if (isNaN(lng) || lng < -180 || lng > 180) {
                return res.status(400).json({ error: 'Invalid longitude value' });
            }
            if (isNaN(rad) || rad <= 0) {
                return res.status(400).json({ error: 'Invalid radius value' });
            }

            const session = await this.sessionManager.createSession(
                userId,
                {
                    latitude: lat,
                    longitude: lng,
                    radius: rad
                }
            );

            res.status(201).json(session);
        } catch (error) {
            console.error('Error creating session:', error);
            if (error instanceof Error) {
                if (error.message === 'Invalid user ID format') {
                    return res.status(400).json({ error: error.message });
                }
                if ((error as CodedError).code === 'USER_NOT_FOUND') {
                    return res.status(400).json({ error: 'User not found' });
                }
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async inviteUser(req: Request, res: Response) {
        try {
            const sessionId = req.params.sessionId;
            const { email } = req.body;
            const user = await this.userService.getUserByEmail(String(email)) as unknown as MongoDocument;

            if (!user) {
                return res.status(404).json({ error: 'No user found with this email' });
            }

            if (!user._id) {
                return res.status(400).json({ error: 'User has no ID' });
            }

            const session = await this.sessionManager.addPendingInvitation(
                sessionId,
                (user._id as unknown as ObjectId).toString()
            );

            // Send notification to invited user
            // if (user.fcmToken && typeof user.fcmToken === 'string') {
            //     await this.notificationService.sendNotification(
            //         user.fcmToken,
            //         'Session Invitation',
            //         'You have been invited to join a BiteSwipe session!'
            //     );
            // }

            res.json(session);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error inviting user:', error);
                if (error.message.includes('already')) {
                    return res.status(400).json({ error: error.message });
                }
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async joinSession(req: Request, res: Response) {
        try {
            const joinCode = req.params.joinCode;
            const { userId } = req.body;

            const session = await this.sessionManager.joinSession(
                joinCode,
                String(userId)
            );

            res.status(200).json(session);
        } catch (error) {
            console.error('Error joining session:', error);
            if (error instanceof Error) {
                if (error.message.includes('not been invited')) {
                    return res.status(403).json({ error: error.message });
                }
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async rejectInvitation(req: Request, res: Response) {
        try {
            const { sessionId, userId } = req.params;

            const session = await this.sessionManager.rejectInvitation(sessionId, userId);

            res.status(200).json(session);
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            if (error instanceof Error) {
                if (error.message.includes('not been invited')) {
                    return res.status(403).json({ error: error.message });
                }
                if (error.message.includes('Session not found')) {
                    return res.status(404).json({ error: error.message });
                }
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async leaveSession(req: Request, res: Response) {
        try {
            const { sessionId, userId } = req.params;

            const session = await this.sessionManager.leaveSession(sessionId, userId);

            res.json(session);
        } catch (error) {
            console.error('Error leaving session:', error);
            if (error instanceof Error) {
                if (error.message.includes('not a participant')) {
                    return res.status(403).json({ error: error.message });
                }
                if (error.message.includes('Session not found')) {
                    return res.status(404).json({ error: error.message });
                }
                if (error.message.includes('creator cannot leave')) {
                    return res.status(400).json({ error: error.message });
                }
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getRestaurantsInSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const restaurants = await this.sessionManager.getRestaurantsInSession(sessionId);
            res.json(restaurants);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            if (error instanceof Error && (error as CodedError).code === 'SESSION_NOT_FOUND') {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sessionSwiped(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const { userId, restaurantId, liked } = req.body;

            const session = await this.sessionManager.sessionSwiped(sessionId, String(userId), String(restaurantId), Boolean(liked));

            res.json({ success: true, session: session._id });
        } catch (error) {
            console.error(error);

            res.status(500).json({ error });
        }
    }

    async startSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const { userId, time } = req.body;

            const session = await this.sessionManager.startSession(sessionId, String(userId), Number(time));

            res.json({ success: true, session: session._id });
        } catch (error) {
            console.error(error);

            res.status(500).json({ error });
        }
    }

    async userDoneSwiping(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const { userId } = req.body;

            const session = await this.sessionManager.userDoneSwiping(sessionId, String(userId));

            res.json({ success: true, session: session._id });
        } catch (error) {
            console.error(error);

            res.status(500).json({ error });
        }
    }

    async getResultForSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;

            const result = await this.sessionManager.getResultForSession(sessionId);
            res.json({ success: true, result });
        } catch (error) {
            console.error(error);

            res.status(500).json({ error });
        }
    }
}