const mongoose = require('mongoose');
const User = require('./models/User'); // Import the User model
require('dotenv').config(); // Load environment variables

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anna-setu';

async function createAdmin() {
    try {
        // 1. Connect to the database
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB to create admin...');

        // 2. Check if an admin user already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists. No action taken.');
            return;
        }

        // 3. Check if the admin password is set in the .env file
        if (!process.env.ADMIN_PASSWORD) {
            throw new Error('ADMIN_PASSWORD is not set in the .env file. Please set it before running this script.');
        }

        // 4. Create the new admin user
        const admin = new User({
            name: 'System Admin',
            email: 'admin@annasetu.com',
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
            status: 'approved' // Admins are approved by default
        });

        await admin.save(); // The password will be automatically hashed by the pre-save hook in User.js
        
        console.log('✅ Admin user created successfully!');
        console.log('--- Admin Credentials ---');
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${process.env.ADMIN_PASSWORD}`);
        console.log('-------------------------');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        // 5. Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

createAdmin();