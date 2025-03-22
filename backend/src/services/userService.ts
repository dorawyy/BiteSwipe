import { Model, Types } from 'mongoose';
import { UserModel, UserLean, User } from '../models/user';

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

      return user;
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
          { $push: { fcmTokens: fcmToken } },
          { new: true }
        )
        .lean();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error: any) {
      console.error('Error updating FCM token:', error);
      if (error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to update FCM token');
    }
  }
}