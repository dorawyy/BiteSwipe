import 'dotenv/config';
import mongoose, { Mongoose } from 'mongoose';
import { createApp } from './app';
import path from 'path';

// Configure mongoose
mongoose.set('strictQuery', true);

const port = process.env.PORT ?? 3000;
const dbUrl = process.env.DB_URI ?? 'mongodb://localhost:27017/biteswipe';

// Define SSL certificate paths
const sslCertPath = process.env.SSL_CERT_PATH ?? path.join(__dirname, '..', '..', 'cert.pem');
const sslKeyPath = process.env.SSL_KEY_PATH ?? path.join(__dirname, '..', '..', 'key.pem');

//Basic startup info
console.log('\n=== Server Configuration ===');
console.log(`HTTPS Port: ${port}`);
console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
console.log('=========================\n');

// TODO : attempted to fix the codacy warning but could not. 
// This make all accesses to mongoose in this file unsafe so
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const typedMongoose: Mongoose = mongoose as unknown as Mongoose;
// eslint-enable-next-line @typescript-eslint/no-unnecessary-type-assertion

// Now we can safely call connect with proper typing
typedMongoose.connect(dbUrl, {
    autoIndex: true, // Build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
})
    .then(() => {
        console.log('\n=== MongoDB Connection Info ===');
        console.log('Connection Status: Connected');
        console.log(`Full URL: \x1b[34m${dbUrl}\x1b[0m`);
        console.log(`Database: ${mongoose.connection.name}`);
        console.log(`Host: ${mongoose.connection.host}`);
        console.log(`Port: ${mongoose.connection.port}`);
        console.log(`Clickable URL: \x1b[34mhttp://${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}\x1b[0m`);
        console.log('============================\n');

    // Create and start HTTP server
    const app = createApp();
    app.listen(port, () => {
        console.log(`\n=== Server Started ===`);
        console.log(`Server is running on http://localhost:${port}`);
        console.log('====================\n');
    });
})
.catch((error : unknown)=> {
    console.error('\n=== MongoDB Connection Error ===');
    console.error('Failed to connect to MongoDB');
    console.error('Error:', (error as Error).message);
    console.error('=============================\n');
});