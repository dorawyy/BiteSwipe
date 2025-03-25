import mongoose from 'mongoose';
import Types from 'mongoose';

interface SessionHistoryEntry {
    sessionId: string;
    role: 'CREATOR' | 'PARTICIPANT';
    joinedAt: Date;
    status: 'ACTIVE' | 'COMPLETED' | 'LEFT';
}

interface RestaurantInteraction {
    restaurantId: string;
    action: 'LIKE' | 'DISLIKE';
    timestamp: Date;
    sessionId: string;
}

// Define the base interface for user properties
export interface IUser {
    email: string;
    displayName: string;
    fcmTokens?: string[];  // Firebase Cloud Messaging tokens
    sessionHistory: SessionHistoryEntry[];
    restaurantInteractions: RestaurantInteraction[];
    friendList: Types.ObjectId[];
    pendingRequest: Types.ObjectId[];
}

// Define the document interface that extends both mongoose.Document and our base interface
export interface User extends mongoose.Document, IUser {
    _id: mongoose.Types.ObjectId;
}

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayName: String,
    fcmTokens: [String],  // Array of FCM tokens
    sessionHistory: [{
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session'
        },
        role: {
            type: String,
            enum: ['CREATOR', 'PARTICIPANT']
        },
        joinedAt: Date,
        status: {
            type: String,
            enum: ['ACTIVE', 'COMPLETED'],
        },
    }],
    friendList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingRequest: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    restaurantInteractions: [{
        restaurantId: String,
        action: {
            type: String,
            enum: ['LIKE', 'DISLIKE']
        },
        timestamp: Date,
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session'
        }
    }]
});
UserSchema.index({ email: 1 }, { unique: true });   
// Create and export the model
export const UserModel = mongoose.model<User>('User', UserSchema);

// Define a type for lean documents (plain JS objects) returned by .lean()
export type UserLean = IUser & {
    _id: string | mongoose.Types.ObjectId;
};