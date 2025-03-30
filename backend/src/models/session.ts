import mongoose, { Document, Types } from 'mongoose';

type SessionStatus = 'CREATED' | 'ACTIVE' | 'MATCHING' | 'COMPLETED';

interface IParticipant {
    userId: Types.ObjectId;
    preferences: {
        restaurantId: string;
        liked: boolean;
        timestamp: Date;
    }[];
}

interface ISession extends Document {
    joinCode: string;
    creator: Types.ObjectId;
    participants: IParticipant[];
    pendingInvitations: Types.ObjectId[];
    status: SessionStatus;
    settings: {
        location: {
            latitude: number;
            longitude: number;
            radius: number;
        };
    };
    restaurants: {
        restaurantId: Types.ObjectId;
        score: number;
        totalVotes: number;
        positiveVotes: number;
        potentialMatchScore: number;
        potentialMatchSwipe: number;
    }[];
    finalSelections?: {
        restaurantId: Types.ObjectId;
        selectedAt: Date;
    }[];
    doneSwiping: Types.ObjectId[];
    createdAt: Date;
    expiresAt: Date;
}

const SessionSchema = new mongoose.Schema<ISession>({
    joinCode: { type: String, unique: true, index: true },
    creator: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    participants: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true 
        },
        preferences: [{
            restaurantId: String,
            liked: Boolean,
            timestamp: Date
        }]
    }],
    pendingInvitations: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    status: {
        type: String,
        enum: ['CREATED', 'MATCHING', 'COMPLETED'],
        default: 'CREATED'
    },
    settings: {
        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            radius: { type: Number, required: true }
        }
    },
    restaurants: [{
        restaurantId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true 
        },
        score: { type: Number, default: 0 },
        totalVotes: { type: Number, default: 0 },
        positiveVotes: { type: Number, default: 0 },
        potentialMatchScore: { type: Number, default: 0 },
        potentialMatchSwipe: {type: Number, default: 0},
    }],
    finalSelections: [{
        restaurantId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant'
        },
        selectedAt: Date
    }],
    doneSwiping: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

export const Session = mongoose.model<ISession>('Session', SessionSchema);
export type { ISession, IParticipant, SessionStatus };