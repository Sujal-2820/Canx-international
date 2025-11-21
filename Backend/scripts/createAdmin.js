/**
 * Script to create a test admin account
 * 
 * Usage: node scripts/createAdmin.js
 * Or: npm run create-admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { connectDB } = require('../config/database');

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Admin details
    const adminData = {
      email: 'admin@irasathi.com',
      password: 'admin123', // Will be hashed automatically
      name: 'Test Admin',
      role: 'super_admin',
      isActive: true,
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email:', adminData.email);
      console.log('Updating password...');
      existingAdmin.password = adminData.password;
      existingAdmin.name = adminData.name;
      existingAdmin.role = adminData.role;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('✅ Admin updated successfully!');
    } else {
      // Create new admin
      const admin = await Admin.create(adminData);
      console.log('✅ Admin created successfully!');
      console.log('📧 Email:', admin.email);
      console.log('👤 Name:', admin.name);
      console.log('🔑 Role:', admin.role);
      console.log('🔒 Password:', adminData.password, '(hashed in database)');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

// Run script
createAdmin();

