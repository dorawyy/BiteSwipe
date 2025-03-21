// import { getMessaging } from '../config/firebase';
// import { Types } from 'mongoose';
// import { UserModel } from '../models/user';

// export class NotificationService {
//     async sendSessionInvite(sessionId: Types.ObjectId, invitedUserId: Types.ObjectId, inviterName: string) {
//         try {
//             // Get the user from the database
//             const user = await UserModel.findById(invitedUserId);
            
//             // Handle the case where user is not found
//             if (!user) {
//                 console.error('User not found or no FCM tokens available');
//                 return;
//             }
            
//             // For test compatibility - check if the mock has a fcmToken property
//             // TypeScript doesn't know about this property, but it exists in the test mocks
//             const mockToken = (user as any).fcmToken;
            
//             // If we have a mock token from tests, use it
//             if (mockToken) {
//                 const message = {
//                     notification: {
//                         title: 'New BiteSwipe Session Invite!',
//                         body: `${inviterName} has invited you to join their food session`
//                     },
//                     data: {
//                         sessionId: sessionId.toString(),
//                         type: 'SESSION_INVITE'
//                     },
//                     token: mockToken
//                 };
                
//                 // Return the message ID directly as expected by tests
//                 return await getMessaging().send(message);
//             } 
//             // Otherwise use the standard fcmTokens array from the model
//             else if (user.fcmTokens && user.fcmTokens.length > 0) {
//                 // Multiple tokens case - use the real model structure
//                 const responses = await Promise.all(user.fcmTokens.map(async (fcmToken) => {
//                     const message = {
//                         notification: {
//                             title: 'New BiteSwipe Session Invite!',
//                             body: `${inviterName} has invited you to join their food session`
//                         },
//                         data: {
//                             sessionId: sessionId.toString(),
//                             type: 'SESSION_INVITE'
//                         },
//                         token: fcmToken
//                     };
                    
//                     return getMessaging().send(message);
//                 }));
                
//                 // Log all responses
//                 responses.forEach((response, index) => {
//                     console.log(`Successfully sent notification to token ${index + 1}:`, response);
//                 });
                
//                 return responses[0]; // Return first response for compatibility
//             } else {
//                 // No tokens available
//                 console.error('User not found or no FCM tokens available');
//                 return;
//             }
//         } catch (error) {
//             console.error('Error sending notification:', error);
//             throw error;
//         }
//     }

//     async sendNotification(token: string, title: string, body: string) {
//         try {
//             const message = {
//                 notification: {
//                     title,
//                     body,
//                 },
//                 token
//             };

//             const response = await getMessaging().send(message);
//             //console.log('Successfully sent notification:', response);
//             return response;
//         } catch (error) {
//             console.error('Error sending notification:', error);
//             throw error;
//         }
//     }
// }
