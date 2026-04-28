import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Company from './models/Company.js';
import User from './models/User.js';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await connectDB();

    // 1. Create the System Company (SaaS Owner)
    let company = await Company.findOne({ name: 'SaaS Corp Management' });
    if (!company) {
      company = await Company.create({
        name: 'SaaS Corp Management',
        industry: 'Software Management',
      });
      console.log('Created System Company');
    }

    // 2. Create the Super Admin
    const email = 'super@saas.com';
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('Super Admin already exists with email:', email);
    } else {
      const superAdmin = await User.create({
        name: 'Super Admin',
        email: email,
        password: 'superpassword123',
        role: 'super-admin',
        companyId: company._id,
      });
      console.log('Super Admin created successfully!');
      console.log('Email:', email);
      console.log('Password: superpassword123');
    }

    process.exit();
  } catch (error) {
    console.error('Failed to create Super Admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
