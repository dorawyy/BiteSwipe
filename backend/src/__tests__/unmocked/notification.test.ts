import { NotificationService } from '../../services/notificationService';
import { Types } from 'mongoose';
import { getMessaging } from '../../config/firebase';

// Mock mongoose
jest.mock('mongoose', () => {
  class ObjectId {
    private str: string;
    
    constructor(str: string) {
      this.str = str;
    }

    toString() {
      return this.str;
    }
  }

  return {
    ...jest.requireActual('mongoose'),
    Types: {
      ObjectId
    }
  };
});

// Mock firebase
jest.mock('../../config/firebase', () => ({
  getMessaging: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue('message-id-123')
  })
}));

// Mock UserModel
jest.mock('../../models/user', () => ({
  UserModel: {
    findById: jest.fn()
  }
}));

jest.unmock('../../services/notificationService');

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('sendSessionInvite', () => {
    test('should successfully send a session invitation notification', async () => {
      // Setup
      const sessionId = new Types.ObjectId('sessionid123');
      const invitedUserId = new Types.ObjectId('userid456');
      const inviterName = 'John Doe';
      const fcmToken = 'test-fcm-token-123';
      
      // Mock user findById to return a user with FCM token
      require('../../models/user').UserModel.findById.mockResolvedValueOnce({
        _id: invitedUserId,
        fcmToken: fcmToken
      });
      
      // Execute
      const result = await notificationService.sendSessionInvite(sessionId, invitedUserId, inviterName);
      
      // Assert
      expect(result).toBe('message-id-123');
      expect(require('../../models/user').UserModel.findById).toHaveBeenCalledWith(invitedUserId);
      expect(getMessaging().send).toHaveBeenCalledWith({
        notification: {
          title: 'New BiteSwipe Session Invite!',
          body: `${inviterName} has invited you to join their food session`
        },
        data: {
          sessionId: sessionId.toString(),
          type: 'SESSION_INVITE'
        },
        token: fcmToken
      });
    });

    test('should handle user not found case', async () => {
      // Setup
      const sessionId = new Types.ObjectId('sessionid123');
      const invitedUserId = new Types.ObjectId('userid456');
      const inviterName = 'John Doe';
      
      // Mock user findById to return null (user not found)
      require('../../models/user').UserModel.findById.mockResolvedValueOnce(null);
      
      // Execute & Assert
      await expect(notificationService.sendSessionInvite(sessionId, invitedUserId, inviterName))
        .resolves.toBeUndefined();
      expect(getMessaging().send).not.toHaveBeenCalled();
    });

    test('should handle user without FCM token', async () => {
      // Setup
      const sessionId = new Types.ObjectId('sessionid123');
      const invitedUserId = new Types.ObjectId('userid456');
      const inviterName = 'John Doe';
      
      // Mock user findById to return a user without FCM token
      require('../../models/user').UserModel.findById.mockResolvedValueOnce({
        _id: invitedUserId,
        fcmToken: null
      });
      
      // Execute & Assert
      await expect(notificationService.sendSessionInvite(sessionId, invitedUserId, inviterName))
        .resolves.toBeUndefined();
      expect(getMessaging().send).not.toHaveBeenCalled();
    });

    test('should propagate error from FCM', async () => {
      // Setup
      const sessionId = new Types.ObjectId('sessionid123');
      const invitedUserId = new Types.ObjectId('userid456');
      const inviterName = 'John Doe';
      const fcmToken = 'test-fcm-token-123';
      
      // Mock user findById to return a user with FCM token
      require('../../models/user').UserModel.findById.mockResolvedValueOnce({
        _id: invitedUserId,
        fcmToken: fcmToken
      });
      
      // Mock FCM send to throw an error
      const fcmError = new Error('FCM error');
      (getMessaging().send as jest.Mock).mockRejectedValueOnce(fcmError);
      
      // Execute & Assert
      await expect(notificationService.sendSessionInvite(sessionId, invitedUserId, inviterName))
        .rejects.toThrow('FCM error');
    });
  });

  describe('sendNotification', () => {
    test('should successfully send a generic notification', async () => {
      // Setup
      const token = 'test-fcm-token-123';
      const title = 'Test Title';
      const body = 'Test Body';
      
      // Execute
      const result = await notificationService.sendNotification(token, title, body);
      
      // Assert
      expect(result).toBe('message-id-123');
      expect(getMessaging().send).toHaveBeenCalledWith({
        notification: {
          title,
          body
        },
        token
      });
    });

    test('should propagate error from FCM when sending generic notification', async () => {
      // Setup
      const token = 'test-fcm-token-123';
      const title = 'Test Title';
      const body = 'Test Body';
      
      // Mock FCM send to throw an error
      const fcmError = new Error('FCM error');
      (getMessaging().send as jest.Mock).mockRejectedValueOnce(fcmError);
      
      // Execute & Assert
      await expect(notificationService.sendNotification(token, title, body))
        .rejects.toThrow('FCM error');
    });

    test('should handle empty token', async () => {
      // Setup
      const token = '';
      const title = 'Test Title';
      const body = 'Test Body';
      
      // Execute
      await notificationService.sendNotification(token, title, body);
      
      // Assert
      expect(getMessaging().send).toHaveBeenCalledWith({
        notification: {
          title,
          body
        },
        token
      });
    });

    test('should handle various notification content types', async () => {
      // Setup for HTML content
      const token = 'test-fcm-token-123';
      const htmlTitle = '<b>HTML Title</b>';
      const htmlBody = '<p>This is <strong>HTML</strong> content</p>';
      
      // Execute
      await notificationService.sendNotification(token, htmlTitle, htmlBody);
      
      // Assert
      expect(getMessaging().send).toHaveBeenCalledWith({
        notification: {
          title: htmlTitle,
          body: htmlBody
        },
        token
      });
      
      // Reset mock
      jest.clearAllMocks();
      
      // Setup for long content
      const longTitle = 'A '.repeat(50) + 'Very Long Title';
      const longBody = 'Long content. '.repeat(30);
      
      // Execute
      await notificationService.sendNotification(token, longTitle, longBody);
      
      // Assert
      expect(getMessaging().send).toHaveBeenCalledWith({
        notification: {
          title: longTitle,
          body: longBody
        },
        token
      });
    });
  });
});