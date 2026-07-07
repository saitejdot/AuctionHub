/**
 * Admin Seed Script
 * Run: node server/scripts/seedAdmin.js
 * Creates the super admin account if it doesn't already exist.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`Admin already exists: ${existingAdmin.email}`);
      process.exit(0);
    }

    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email: process.env.ADMIN_EMAIL || 'admin@auctionhub.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
    });

    console.log(`Admin created successfully: ${admin.email}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();
