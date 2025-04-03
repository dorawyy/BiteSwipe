import './unmocked_setup';

import supertest from 'supertest';
import { createApp } from '../../app';
import { UserModel } from '../../models/user';
import mongoose from 'mongoose';
import { Session } from '../../models/session';

let agent: any;

describe('POST /users/:email/acceptRequest', () => {
    beforeAll(() => {
        const app = createApp();
        agent = supertest(app);
    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
        await Session.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
    });

    test('POST /users/:email/acceptRequest', async () => {
        const userData1 = {
            email: "test1@example.com",
            displayName: "Test User1"
          };
          
        const response1 = await agent
            .post("/users")
            .send(userData1)
            .expect("Content-Type", /json/)
            .expect(201);

        expect(response1.body).not.toBeNull();

        const response2 = await agent
            .post('/users/test1@example.com/acceptRequest')
            .send({
                userEmail: ' ',
                friendEmail: ' '
            });
        console.log(response2.body);
    });

    test('POST  /Users/:email/acceptRequest', async () => {
        const userData1 = {
            email: "test1@example.com",
            displayName: "Test User1"
          };
           
        const response1 = await agent
            .post("/users")
            .send(userData1)
            .expect(201);
        
        expect(response1.body).not.toBeNull();

        const response2 = await agent   
            .post("/users/test1@example.com/acceptRequest")
            .send({
                friendEmail: 'test2@example.com'
            })
        expect(response2.body.status).not.toBeNull();

        const response3 = await agent 
            .post('/users/test2@example.com/acceptRequest')
            .send({
                friendEmail: 'test1@example.com'
            });
        expect(response3.body.status).not.toBeNull();  
        
    });

    test('POST /users/:email/friendRequest Success and than Fail', async () => {
        const userData1 = {
            email: "test1@example.com",
            displayName: "Test User1"
          };
        
          const userData2 = {
            email: "test2@example.com",
            displayName: "Test User2"
          };

        const response1 = await agent
            .post("/users")
            .send(userData1)
            .expect("Content-Type", /json/)
            .expect(201);
        expect(response1.body).not.toBeNull();

        const response2 = await agent
            .post("/users")
            .send(userData2)
            .expect("Content-Type", /json/)
            .expect(201);
        expect(response2.body).not.toBeNull();
        
        const response3 = await agent    
            .post("/users/test1@example.com/friendRequest")
            .send({
                friendEmail: "test2@example.com"
            });
        expect(response3.body.status).not.toBeNull();
        
        const response4 = await agent
            .post("/users/test2@example.com/acceptRequest")
            .send({
                friendEmail: "test1@example.com"
            });
        console.log(response4.body);
    });
})