import mongoose, { Types } from 'mongoose';
import { Session, ISession, SessionStatus } from '../models/session';
import { RestaurantService } from './restaurantService';
import { UserModel } from '../models/user';
import crypto from 'crypto';

interface CustomError extends Error {
    code?: string;
}

export class SessionManager {
    private readonly joinCodeCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    private restaurantService: RestaurantService;

    constructor(restaurantService: RestaurantService) {
        this.restaurantService = restaurantService;
    }

    async createSession(
        userId: string,
        settings: {
            latitude: number;
            longitude: number;
            radius: number;
        }
    ): Promise<ISession> {
        try {
            // Validate and convert userId to ObjectId
            if (!Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID format');
            }
            const userObjectId = new Types.ObjectId(userId);
            // Check if user exists
            const user = await UserModel.findById(userObjectId);
            if (!user) {
                const error = new Error() as CustomError;
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            // Set expiry to 24 hours from now
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const restaurants = await this.restaurantService.addRestaurants(settings, '') as { _id: string; }[];

            const joinCode = await this.generateUniqueJoinCode();

            const session = new Session({
                creator: userId,
                participants: [{
                    userId,
                    preferences: []
                }],
                pendingInvitations: [],
                settings: {
                    location: settings
                },
                restaurants: restaurants.map(r => {
                    return {
                        restaurantId: r._id,
                        score: 0,
                        totalVotes: 0,
                        positiveVotes: 0
                    };
                }),
                joinCode,
                status: 'CREATED' as SessionStatus,
                expiresAt
            });

            session.doneSwiping = [new Types.ObjectId(userId)];

            await session.save();
            return session;
        } catch (error) {
            console.error('Session creation error:', error);
            throw error;
        }
    }

    private async generateUniqueJoinCode(): Promise<string> {
        let isUnique = false;
        let joinCode = '';

        while (!isUnique) {
            joinCode = '';
            for (let i = 0; i < 5; i++) {
                const randomIndex = crypto.randomInt(0, this.joinCodeCharacters.length);
                joinCode += this.joinCodeCharacters.charAt(randomIndex);
            }

            const existingSession = await Session.findOne({ joinCode, status: { $ne: 'COMPLETED' } });

            isUnique = !existingSession;
        }

        return joinCode;
    }


    async sessionSwiped(sessionId: string, userId: string, restaurantId: string, swipe: boolean) {
        if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(restaurantId)) {
            throw new Error('Invalid ID format');
        }
        const sessionObjId = new Types.ObjectId(sessionId);
        const userObjId = new Types.ObjectId(userId);
        const restaurantObjId = new Types.ObjectId(restaurantId);
        const session = await Session.findOneAndUpdate(
            {
                _id: sessionObjId,
                status: { $eq: 'MATCHING' },
                'participants.userId': userObjId,
                'participants': {
                    // TODO: BUG AFTER MVP; user should be able to revote in case of tie
                    $not: {
                        $elemMatch: {
                            userId: userObjId,
                            'preferences.restaurantId': restaurantObjId
                        }
                    }
                }
            },
            {
                $push: {
                    'participants.$.preferences': {
                        restaurantId: restaurantObjId,
                        liked: swipe,
                        timestamp: new Date()
                    }
                },
                $inc: {
                    'restaurants.$[restaurant].score': swipe ? 1 : -0.5,
                    'restaurants.$[restaurant].totalVotes': 1,  
                    'restaurants.$[restaurant].positiveVotes': swipe ? 1 : 0
                }
            },
            { 
                new: true,
                runValidators: true,
                arrayFilters: [{ 'restaurant.restaurantId': restaurantObjId }] 
            }
        );

        if (!session) {
            const existingSession = await Session.findOne({
                _id: sessionObjId,
                'participants': {
                    $elemMatch: {
                        userId: userObjId,
                        'preferences.restaurantId': restaurantObjId
                    }
                }
            });

            if (existingSession) {
                throw new Error('User already swiped on this restaurant');
            } else {
                throw new Error('Session does not exist or already completed or user not in session');
            }
        }
        return session;
    }

    async addPendingInvitation(sessionId: string, userId: string): Promise<ISession> {
        if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid ID format');
        }
        const sessionObjectId = new Types.ObjectId(sessionId);
        const userObjectId = new Types.ObjectId(userId);

        const updatedSession = await Session.findOneAndUpdate(
            {
                _id: sessionObjectId,
                status: { $ne: 'COMPLETED' },
                'participants.userId': { $ne: userObjectId },
                pendingInvitations: { $ne: userObjectId }
            },
            {
                $push: {
                    pendingInvitations: userObjectId,
                    doneSwiping: userObjectId
                }
            },
            { new: true, runValidators: true }
        );

        // Handle failure cases
        if (!updatedSession) {
            // Find the session to determine the specific error
            const session = await Session.findById(sessionObjectId);

            if (!session) {
                throw new Error('Session not found');
            } else if (session.status === 'COMPLETED') {
                throw new Error('Cannot invite users to a completed session');
            } else if (session.participants.some(p => p.userId.equals(userObjectId))) {
                throw new Error('User is already a participant');
            } else if (session.pendingInvitations.some(id => id.equals(userObjectId))) {
                throw new Error('User has already been invited');
            } else {
                throw new Error('Failed to invite user to session');
            }
        }

        return updatedSession;
    }

    async joinSession(joinCode: string, userId: string): Promise<ISession> {
        if (!Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid user ID format');
        }
        const userObjectId = new Types.ObjectId(userId);

        const updatedSession = await Session.findOneAndUpdate(
            {
                joinCode,
                status: { $ne: 'COMPLETED' },
                pendingInvitations: userObjectId,
                'participants.userId': { $ne: userObjectId }
            },
            {
                $pull: { pendingInvitations: userObjectId },
                $push: {
                    participants: {
                        userId: userObjectId,
                        preferences: []
                    }
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedSession) {
            // Determine the specific reason for failure
            const session = await Session.findOne({ joinCode });

            if (!session) {
                throw new Error('Session not found');
            } else if (session.status === 'COMPLETED') {
                throw new Error('Cannot join a completed session');
            } else if (session.participants.some(p => p.userId.equals(userObjectId))) {
                throw new Error('User is already a participant');
            } else {
                throw new Error('User has not been invited to this session');
            }
        }

        return updatedSession;
    }

    async getUserSessions(userId: string): Promise<ISession[]> {
        try {
            if (!Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID format');
            }
            const userObjectId = new Types.ObjectId(userId);

            // Check if user exists
            const user = await UserModel.findById(userObjectId);
            if (!user) {
                const error = new Error('User not found') as CustomError;
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            const sessions = await Session.find({
                $or: [
                    { creator: userObjectId },
                    { 'participants.userId': userObjectId },
                    { pendingInvitations: userObjectId }
                ],
                status: { $ne: 'COMPLETED' as SessionStatus }
            }).sort({ createdAt: -1 }); // Most recent first

            return sessions;
        } catch (error) {
            console.error('Error fetching user sessions:', error);
            throw error;
        }
    }

    async getSession(sessionId: string): Promise<ISession> {
        try {
            if (!Types.ObjectId.isValid(sessionId)) {
                throw new Error('Invalid session ID format');
            }
            const sessionObjId = new Types.ObjectId(sessionId);
            
            const session = await Session.findById(sessionObjId);
            if (!session) {
                const error = new Error('Session not found') as Error & { code?: string; };
                error.code = 'SESSION_NOT_FOUND';
                throw error;
            }
            return session;
        } catch (error) {
            console.error('Error fetching session:', error);
            throw error;
        }
    }

    async rejectInvitation(sessionId: string, userId: string): Promise<ISession> {
        if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid ID format');
        }
        const sessionObjectId = new Types.ObjectId(sessionId);
        const userObjectId = new Types.ObjectId(userId);

        const updatedSession = await Session.findOneAndUpdate(
            {
                _id: sessionObjectId,
                status: { $ne: 'COMPLETED' },
                pendingInvitations: userObjectId,
                'participants.userId': { $ne: userObjectId }
            },
            {
                $pull: { pendingInvitations: userObjectId }
            },
            { new: true, runValidators: true }
        );

        // Handle failure cases
        if (!updatedSession) {
            // Find the session to determine the specific error
            const session = await Session.findById(sessionObjectId);

            if (!session) {
                throw new Error('Session not found');
            } else if (session.status === 'COMPLETED') {
                throw new Error('Cannot reject invitation for a completed session');
            } else if (session.participants.some(p => p.userId.equals(userObjectId))) {
                throw new Error('User is already a participant');
            } else {
                throw new Error('User has not been invited to this session');
            }
        }

        return updatedSession;
    }

    async leaveSession(sessionId: string, userId: string): Promise<ISession> {
        if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid ID format');
        }
        const sessionObjectId = new Types.ObjectId(sessionId);
        const userObjectId = new Types.ObjectId(userId);

        // Use findOneAndUpdate to perform an atomic operation
        const updatedSession = await Session.findOneAndUpdate(
            {
                _id: sessionObjectId,
                status: { $ne: 'COMPLETED' },
                creator: { $ne: userObjectId },
                'participants.userId': userObjectId
            },
            {
                $pull: { participants: { userId: userObjectId } }
            },
            { new: true, runValidators: true }
        );

        // Handle failure cases
        if (!updatedSession) {
            // Find the session to determine the specific error
            const session = await Session.findById(sessionObjectId);

            if (!session) {
                throw new Error('Session not found');
            } else if (session.status === 'COMPLETED') {
                throw new Error('Cannot leave a completed session');
            } else if (session.creator.equals(userObjectId)) {
                throw new Error('Session creator cannot leave the session');
            } else {
                throw new Error('User is not a participant in this session');
            }
        }

        return updatedSession;
    }

    async getRestaurantsInSession(sessionId: string) {
        try {
            if (!Types.ObjectId.isValid(sessionId)) {
                throw new Error('Invalid session ID format');
            }
            const sessionObjId = new Types.ObjectId(sessionId);
            
            const session = await Session.findOne({
                _id: sessionObjId
            });

            if (!session) {
                const error = new Error('Session not found') as CustomError;
                error.code = 'SESSION_NOT_FOUND';
                throw error;
            }

            const restaurantsIds = session.restaurants.map(r => r.restaurantId);
            return await this.restaurantService.getRestaurants(restaurantsIds);
        } catch (error) {
            console.error('Error getting restaurants in session:', error);
            throw error;
        }
    }

    async startSession(sessionId: string, userId: string, time: number) {
        if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid ID format');
        }

        const sessionObjId = new Types.ObjectId(sessionId);
        const userObjId = new Types.ObjectId(userId);

        const session = await Session.findOneAndUpdate(
            {
                _id: sessionObjId,
                creator: userObjId,
                status: 'CREATED'
            },
            {
                status: 'MATCHING'
            },
            { new: true, runValidators: true }
        );

        if (!session) {
            throw new Error('Session does not exists or user is not the creator or session does not have created status');
        }

        //Schedule the session to be marked as completed after 10 minutes
        // Schedule the session to be marked as completed after the specified time
        setTimeout(() => {
            (async () => {  // Self-invoking async function
                try {
                    await Session.findByIdAndUpdate(
                        sessionId,
                        { status: 'COMPLETED' },
                        { runValidators: true }
                    );
                } catch (error) {
                    console.error(error);
                }
            })().catch((error: unknown) => {
                console.error('Error in completing session:', error);
            });
        }, time * 60 * 1000);  // No need for ?? 5        


        return session;
    }

    async userDoneSwiping(sessionId: string, userId: string) {
        if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid ID format');
        }
        const sessionObjId = new Types.ObjectId(sessionId);
        const userObjId = new Types.ObjectId(userId);

        const session = await Session.findOneAndUpdate(
            {
                _id: sessionObjId,
                status: 'MATCHING',
                'participants.userId': userObjId,
            },
            {
                $pull: { doneSwiping: userObjId }
            },
            { new: true, runValidators: true }
        );

        if (!session) {
            throw new Error('Session does not exists or user is not in session or user has already swiped');
        }

        if (session.doneSwiping.length === 0) {
            session.status = 'COMPLETED';
            await session.save();
        }

        return session;
    }

    async getResultForSession(sessionId: string) {
        if (!Types.ObjectId.isValid(sessionId)) {
            throw new Error('Invalid session ID format');
        }
        const sessionObjId = new Types.ObjectId(sessionId);
        
        const session = await Session.findById(sessionObjId);
        if (!session) {
            throw new Error('Session not found');
        }

        // Only allow completed sessions or matching sessions where everyone is done swiping TODO: WTF IS THIS?
        if (session.status !== 'COMPLETED' &&
            (session.status === 'MATCHING' && (session.doneSwiping.length !== 0 || (session.finalSelections?.length ?? 0) < 3))) {
            throw new Error('Session is not completed');
        }

        // return Top 3 restaurants by score 

        if (session.finalSelections?.length === 3) {
            if (session.status === 'MATCHING') {
                session.status = 'COMPLETED';
                await session.save();
            }
            return this.restaurantService.getRestaurants(session.finalSelections.map(r => r.restaurantId));
        } else {
            if (session.status === 'MATCHING') {
                // Mark the session as completed
                session.status = 'COMPLETED';
                await session.save();
            }

            // will return the top 3 restaurants by score

            const sortedRestaurants = session.restaurants.sort((a, b) => b.score - a.score);
            const topRestaurants = sortedRestaurants.slice(0, 3);

            return this.restaurantService.getRestaurants(topRestaurants.map(r => r.restaurantId));
        }
    }

    async getPotentialMatch(sessionId: string) {
        if (!Types.ObjectId.isValid(sessionId)) {
            throw new Error('Invalid session ID format');
        }
        const sessionObjId = new Types.ObjectId(sessionId);

        const session = await Session.findById(sessionObjId);   

        if (!session) {
            throw new Error('Session not found');
        }   

        if (session.status !== 'MATCHING') {
            throw new Error('Session is not in matching state');
        }

        const participantsLength = session.participants.length;
        const pendingInvitationsLength = session.pendingInvitations.length; 

        for(const restaurant of session.restaurants) {
            if (restaurant.positiveVotes >= 0.75 * participantsLength) {
                // checking if restaurant is not the part of finalSelection already
                if (!session.finalSelections?.some(r => r.restaurantId.equals(restaurant.restaurantId))) {
                    if(!(restaurant.potentialMatchSwipe > 0)){
                        return this.restaurantService.getRestaurant(restaurant.restaurantId);
                    }
                }
            }
        }
    
        throw new Error('No potential match found');
    }

    async potentialMatchSwiped(sessionId: string, restaurantId: string, swipe: boolean) {
        if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(restaurantId)) {
            throw new Error('Invalid ID format');
        }
        const sessionObjId = new Types.ObjectId(sessionId);
        const restaurantObjId = new Types.ObjectId(restaurantId);

        const session = await Session.findOneAndUpdate(
            {
                _id: sessionObjId,
                'restaurants.restaurantId': restaurantObjId
            },
            {
                $inc: {
                    'restaurants.$[restaurant].potentialMatchScore': swipe ? 1 : 0,
                    'restaurants.$[restaurant].potentialMatchSwipe': 1
                }
            },
            { 
                new: true,
                runValidators: true,
                arrayFilters: [{ 'restaurant.restaurantId': restaurantObjId }] 
            }
        );

        if (!session) {
            throw new Error('Session does not exist or already completed or restaurant not in session');
        }
        return session;
    }

    async getPotentialMatchResult(sessionId: string, restaurantId: string) {
        if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(restaurantId)) {
            throw new Error('Invalid ID format');
        }

        const sessionObj = new Types.ObjectId(sessionId);
        const restaurantObj = new Types.ObjectId(restaurantId); 

        const session = await Session.findById(sessionObj);

        if (!session) {
            throw new Error('Session not found');
        }

        const restaurant = session.restaurants.find(r => r.restaurantId.equals(restaurantObj));
        if (!restaurant) {
            throw new Error('Session not found');
        }

        if (restaurant.potentialMatchSwipe >= session.participants.length) {
            if(restaurant.potentialMatchScore === session.participants.length) {
                await Session.findOneAndUpdate(
                    {
                        _id: sessionObj,
                        'restaurants.restaurantId': restaurantObj
                    },
                    {
                        $push: {
                            finalSelections: {
                                restaurantId: restaurantObj,
                                selectedAt: new Date()
                            }
                        },
                        $set: { status : 'COMPLETED' }
                    },
                    { 
                        new: true,
                        runValidators: true,
                    }
                );
                return {success: true, result : this.restaurantService.getRestaurant(restaurantObj)};
            } else {
                await Session.findOneAndUpdate(
                    {
                        _id: sessionObj,
                        'restaurants.restaurantId': restaurantObj
                    },
                    {
                        $push: {
                            finalSelections: {
                                restaurantId: restaurantObj,
                                selectedAt: new Date()
                            }
                        }
                    },
                    { 
                        new: true,
                        runValidators: true,
                    }
                );
                return {success: true, result : null}
            }
        } else {
            return {success: false, message: "Not enough votes for this restaurant"};
        }
    }

    async getSessionStatus (sessionId: string) {
        if (!Types.ObjectId.isValid(sessionId)) {
            throw new Error('Invalid session ID format');
        }

        const sessionObjId = new Types.ObjectId(sessionId); 

        const session = await Session.findById(sessionObjId);
        if (!session) {
            throw new Error('Session not found');
        }
        return session.status;
    }

}

 
