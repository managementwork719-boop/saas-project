import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from './models/Company.js';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Create a Company
    const company = await Company.create({
      name: 'Demo Corp',
      industry: 'Technology',
    });
    console.log('Created Company:', company.name);

    // 2. Create an Admin for that company
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@democorp.com',
      password: 'password123',
      role: 'admin',
      companyId: company._id,
    });
    console.log('Created Admin:', admin.email);

    console.log('Seed completed successfully! You can now login with: admin@democorp.com / password123');
    process.exit();
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
