import { Model, Types } from 'mongoose';
import { UserModel, UserLean, User } from '../models/user';
import { sendNotification } from '../config/firebase';

export class UserService {
  private userModel: Model<User>;

  constructor(userModel: Model<User> = UserModel) {
    this.userModel = userModel;
  }

  async createUser(email: string, displayName: string): Promise<UserLean> {
    if (!email || !displayName) {
      throw new Error('Email and displayName are required');
    }

    const existingUser = await this.getUserByEmail(email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    try {
      const user = await this.userModel.create({
        email,
        displayName,
        sessionHistory: [],
        restaurantInteractions: []
      });

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUserById(userId: string): Promise<UserLean | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    try {
      const user = await this.userModel.findById(userId).lean();

      if (!user) {
        return null;
      }

      return user as UserLean;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user by ID');
    }
  }

  async getUserByEmail(email: string): Promise<UserLean | null> {
    if (!email) {
      throw new Error('Email is required'); // TODO need to be mocked to get coverage ( hard to do now)
    }

    try {
      // Simple, clean implementation focused on production code
      return await this.userModel.findOne({ email }).lean();
    } catch (error: unknown) {
      console.error('Error fetching user by email:', error);
      throw new Error('Failed to fetch user by email');
    }
  }

  async updateFCMToken(userId: string, fcmToken: string): Promise<UserLean | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    if (!fcmToken) {
      throw new Error('FCM token is required');
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $addToSet: { fcmTokens: fcmToken } }, 
          { new: true }
        )
        .lean();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser  as UserLean;
    } catch (error: any) {
      console.error('Error updating FCM token:', error);
      if (error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to update FCM token');
    }
  }

  async updateDisplayName(userId: string, displayName: string): Promise<UserLean | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: { displayName: displayName } },
          { new: true }
        )
        .lean();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser as UserLean;
    } catch (error: any) {
      console.error('Error updating display name:', error);
      if (error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to update display name');
    }
  }


  async sendFriendRequest(userEmail: string, friendEmail: string): Promise<UserLean | null> {
    if(userEmail.trim().length === 0 || friendEmail.trim().length === 0) {
      throw new Error('User email and friend email is required');
    }

    const userId = await this.getUserByEmail(userEmail);

    if (!userId) {
      throw new Error('User not found');
    }

    const friend = await this.getUserByEmail(friendEmail);

    if (!friend) {
      throw new Error('User added not found');
    }

    if(userId.friendList.some(f => f.userId.toString() === friend._id.toString())) {
      throw new Error('Already a friend');
    }
    // check if the request already exists
  
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          friend._id,
          { $push: { pendingRequest:{userId: userId._id, displayName: userId.displayName, email: userId.email}}},
          { new: true, unique: true }
        )
        .lean();

      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      // send notification 
      const fcmToken = friend.fcmTokens;
      console.log(`FCMTokens for user ${friend.email}: ${fcmToken} `);
      if(fcmToken){
        const notificationData = {
          type: "friend",
          title: "New Friend Request",
          message: `You've got a request from ${userId.displayName}`,
          friendId: friend._id.toString()
        }
        if(fcmToken.length == 1){
          try {
            sendNotification(fcmToken.toString(), "New Friend Request", `You've got a request from ${userId.displayName}`, notificationData);
          }
          catch (error) {
            console.error("Could not send notification")
          }
        } else {
          for(let token in fcmToken) {
            try{
              sendNotification(token, "New Friend Request", `You've got a request from ${userId.displayName}`, notificationData);
            } catch (error) {
              console.error("Could not send notification");
            }
          }
        }
      }

      return updatedUser as UserLean;
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to send friend request');
    }
  }

  async acceptFriendRequest   (userEmail: string, friendEmail: string ) : Promise<string[] | null> {
    if(userEmail.trim().length === 0 || friendEmail.trim().length === 0) {
      throw new Error('User email and friend email is required');
    }    

    const userId = await this.getUserByEmail(userEmail);

    if (!userId) {
      throw new Error('User not found');
    }

    const friend = await this.getUserByEmail(friendEmail);

    if (!friend) {
      throw new Error('Friend not found');
    }
    
  
    try {
      // update user's friendList
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $push: { friendList: {userId: friend._id, displayName: friend.displayName, email: friend.email}}, $pull: { pendingRequest: {userId: friend._id }}},
          { new: true, unique: true }
        )
        .lean();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      // update friend's friendList
      const updatedFriend = await this.userModel
      .findByIdAndUpdate(
        friend,
        { $push: {friendList: {userId: userId._id, displayName: userId.displayName, email: userId.email }}},
        {new: true, unique: true}
      )
      .lean();

      if(!updatedFriend) {
        throw new Error('Friend not found');
      }

      const friendDisplayName: string[] = [];

      for(const friendId of updatedUser.friendList) {
        const friend = await this.userModel.findById(friendId).lean();
        if(friend) {
          friendDisplayName.push(friend?.displayName);
        }
      }

      return friendDisplayName as string[];
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      if (error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to accept friend request');
    }
  }

  async rejectFriendRequest(userEmail: string, friendEmail: string): Promise<UserLean | null> {
    if(userEmail.trim().length === 0 || friendEmail.trim().length === 0) {
      throw new Error('User email and friend email is required');
    }

    const userId = await this.getUserByEmail(userEmail);

    if (!userId) {
      throw new Error('User not found');
    }

    const friend = await this.getUserByEmail(friendEmail);

    if (!friend) {
      throw new Error('Friend not found');
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $pull: { pendingRequest: {userId: friend._id }}},
          { new: true, unique: true }
        )
        .lean();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser as UserLean;
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      if (error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to reject friend request');
    }
  }

  async removeFriend(userEmail: string, friendEmail: string): Promise<string[] | null> {
    if(userEmail.trim().length === 0 || friendEmail.trim().length === 0) {
      throw new Error('User email and friend email is required');
    }

    const userId = await this.getUserByEmail(userEmail);

    if (!userId) {
      throw new Error('User not found');
    }

    const friend = await this.getUserByEmail(friendEmail);

    if (!friend) {
      throw new Error('Friend not found');
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId._id,
          { $pull: { friendList: {userId: friend._id }}},
          { new: true, unique: true }
        )
        .lean();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      const updatedFriend = await this.userModel
        .findByIdAndUpdate(
          friend._id,
          { $pull: {friendList: {userId: userId._id}}},
          { new: true, unique: true}
        )
        .lean();
      if(!updatedFriend) {
        throw new Error('Not removed from friend');
      }

      const friendDisplayName: string[] = [];

      for(const friendId of updatedUser.friendList) {
        const friend = await this.userModel.findById(friendId).lean();
        if(friend) {
          friendDisplayName.push(friend?.displayName);
        }
      }

      return friendDisplayName as string[];
    } catch (error: any) {
      console.error('Error removing friend:', error);
      if (error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to remove friend');
    }
  }

}