const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

    const emailTransporter = process.env.SMTP_HOST && process.env.SMTP_USER
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT?.trim() || 587),
          secure: Number(process.env.SMTP_PORT?.trim() || 587) === 465,
          auth: {
            user: process.env.SMTP_USER?.trim(),
            pass: process.env.SMTP_PASS?.trim().replace(/\s/g, ''),
          },
        })
      : null;

const signToken = (user) => jwt.sign(
  { id: user._id.toString(), role: user.role },
  process.env.JWT_SECRET || 'finance_collection_secret_fallback_key_2026',
  { expiresIn: process.env.JWT_EXPIRE || '7d' }
);

const buildUserPayload = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt
});

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { fullName, email, phone, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const normalizedPhone = phone.trim();

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const phoneExists = await User.findOne({ phone: normalizedPhone });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }

    const user = new User({
      fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      role: 'user'
    });

    await user.save();

    res.status(201).json({
      message: 'Account created successfully',
      user: buildUserPayload(user)
    });
  } catch (err) {
    if (err?.code === 11000) {
      const duplicatedField = Object.keys(err.keyValue || {})[0];
      if (duplicatedField === 'email') {
        return res.status(400).json({ message: 'Email already in use' });
      }
      if (duplicatedField === 'phone') {
        return res.status(400).json({ message: 'Phone number already in use' });
      }

      return res.status(400).json({ message: 'Account already exists' });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { identifier, password } = req.body;
    const lookupValue = identifier.trim();
    const user = await User.findOne({
      $or: [
        { email: lookupValue.toLowerCase() },
        { phone: lookupValue }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);

    res.json({ token, user: buildUserPayload(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Registered email is required' });
    }

    const lookupValue = identifier.trim();
    const user = await User.findOne({ email: lookupValue.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 15 mins from now
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    
    await user.save();

    if (!emailTransporter) {
      return res.status(500).json({ message: 'Email service is not configured' });
    }

    try {
      await emailTransporter.sendMail({
        from: `Finance Collection <${(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim()}>`,
        to: user.email,
        subject: 'Your Password Recovery Code',
        text: `Your Finance Collection system password reset code is: ${otp}\n\nIt will expire in 15 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563EB;">Password Recovery</h2>
            <p>Your password reset code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #111827;">${otp}</h1>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send Email:', emailError);
      return res.status(500).json({
        message: process.env.NODE_ENV === 'production'
          ? 'Failed to send recovery code to the registered email'
          : `Failed to send recovery code to the registered email: ${emailError.message}`
      });
    }

    res.json({ 
      message: 'Recovery code sent to your registered email successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: 'Identifier, OTP, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const lookupValue = identifier.trim();
    const user = await User.findOne({
      $or: [
        { email: lookupValue.toLowerCase() },
        { phone: lookupValue }
      ],
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'OTP is invalid or has expired' });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
