import Company from '../models/Company.js';
import { encrypt } from '../utils/encryption.js';
import sendEmail from '../utils/sendEmail.js';

export const updateMyCompany = async (req, res, next) => {
  try {
    const { 
        themeColor, name, industry, website, logo, address, phone, businessEmail, bankDetails,
        invoiceBranding, quotationBranding
    } = req.body;
    
    // The company ID is stored in the user object from the protect middleware
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(404).json({
        status: 'fail',
        message: 'No company associated with this user'
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      { 
        themeColor, name, industry, website, logo, address, phone, businessEmail, bankDetails,
        invoiceBranding, quotationBranding
      },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        company: updatedCompany
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyCompany = async (req, res, next) => {
    try {
      const company = await Company.findById(req.user.companyId);
      res.status(200).json({
        status: 'success',
        data: { company }
      });
    } catch (err) {
      next(err);
    }
};
export const updateSmtpSettings = async (req, res, next) => {
    try {
        const { host, port, user, pass, senderName, senderEmail } = req.body;
        const companyId = req.user.companyId;

        if (!host || !port || !user || !pass) {
            return res.status(400).json({ status: 'fail', message: 'All SMTP fields are required' });
        }

        const encryptedPass = encrypt(pass);

        const updatedCompany = await Company.findByIdAndUpdate(
            companyId,
            {
                smtpConfig: {
                    host,
                    port,
                    user,
                    pass: encryptedPass,
                    senderName: senderName || 'Work Management',
                    senderEmail: senderEmail || user
                }
            },
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'SMTP settings updated successfully',
            data: { company: updatedCompany }
        });
    } catch (err) {
        next(err);
    }
};

export const testSmtpSettings = async (req, res, next) => {
    try {
        const { host, port, user, pass, senderName, senderEmail } = req.body;

        await sendEmail({
            email: req.user.email,
            subject: 'System: SMTP Connection Test',
            message: 'If you are reading this, your SMTP configuration is correct.',
            html: '<h3>Connection Verified</h3><p>Your SMTP settings are working perfectly.</p>',
            smtpConfig: { host, port, user, pass, senderName, senderEmail }
        });

        res.status(200).json({
            status: 'success',
            message: 'Test email sent successfully to ' + req.user.email
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: 'Connection failed: ' + err.message });
    }
};
