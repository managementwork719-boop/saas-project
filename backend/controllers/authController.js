import User from '../models/User.js';
import Company from '../models/Company.js';
import jwt from 'jsonwebtoken';
import { createActivityLog } from '../utils/logger.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Invisible to JavaScript (Protects against XSS)
    secure: process.env.NODE_ENV === 'production', // Required for cross-site cookies
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token, // Keeping token in response for legacy compatibility if needed
    data: {
      user,
    },
  });
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
    }

    // 2) Check if user exists && password is correct
    // Only populate essential company fields
    const user = await User.findOne({ email })
      .select('+password')
      .populate('companyId', 'name themeColor'); 

    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
    }

    // 3) Check if user must change password (first time login)
    if (user.mustChangePassword) {
      return res.status(200).json({
        status: 'password-reset-required',
        message: 'First-time login detected. You must set a permanent password.',
        data: { email: user.email }
      });
    }

    // 4) If everything ok, send token to client
    sendToken(user, 200, res);

    // 5) Log activity
    req.user = user; // Set user to req for logger
    createActivityLog(req, {
      action: 'Login',
      module: 'Auth',
      description: `User logged in successfully`
    });
  } catch (err) {
    next(err);
  }
};

export const setupPassword = async (req, res, next) => {
  try {
    const { email, temporaryPassword, newPassword } = req.body;

    if (!email || !temporaryPassword || !newPassword) {
      return res.status(400).json({ status: 'fail', message: 'Missing required credentials' });
    }

    // 1) Find user and verify temp password
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(temporaryPassword, user.password))) {
      return res.status(401).json({ status: 'fail', message: 'Invalid email or temporary password' });
    }

    // 2) Update password and clear temp flag
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    // Log activity
    req.user = user;
    createActivityLog(req, {
      action: 'Setup Password',
      module: 'Auth',
      description: `User completed initial password setup`
    });

    res.status(200).json({
      status: 'success',
      message: 'Password established successfully. You can now login.'
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };
  res.cookie('jwt', 'loggedout', cookieOptions);
  
  // Log activity before finishing
  if (req.user) {
    createActivityLog(req, {
      action: 'Logout',
      module: 'Auth',
      description: `User logged out`
    });
  }

  res.status(200).json({ status: 'success' });
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('companyId');
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};
