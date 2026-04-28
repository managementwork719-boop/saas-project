import Company from '../models/Company.js';
import User from '../models/User.js';
import { createActivityLog } from '../utils/logger.js';

export const setupNewCompany = async (req, res, next) => {
  try {
    const { companyName, industry, adminName, adminEmail, adminPassword } = req.body;

    // 1. Create the Company
    const company = await Company.create({
      name: companyName,
      industry: industry,
    });

    // 2. Create the first Admin for that company
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      companyId: company._id,
    });

    // 3. Remove password from response
    admin.password = undefined;

    res.status(201).json({
      status: 'success',
      message: 'Company and Admin created successfully',
      data: {
        company,
        admin,
      },
    });

    createActivityLog(req, {
      action: 'Setup Company',
      module: 'System',
      description: `Setup new company: ${company.name} and admin: ${admin.email}`
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

export const getAllCompanies = async (req, res, next) => {
    try {
      const companies = await Company.find();
      res.status(200).json({
        status: 'success',
        results: companies.length,
        data: { companies }
      });
    } catch (err) {
      next(err);
    }
};
export const updateCompany = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, industry } = req.body;

        const company = await Company.findByIdAndUpdate(
            id, 
            { name, industry }, 
            { new: true, runValidators: true }
        );

        if (!company) {
            return res.status(404).json({
                status: 'fail',
                message: 'Company not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { company }
        });

        createActivityLog(req, {
            action: 'Update Company',
            module: 'System',
            description: `Updated company details for ${company.name}`
        });
    } catch (err) {
        next(err);
    }
};
