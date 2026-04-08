import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import OTP from '../../../models/OTP';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  await connectDB();
  const existingUser = await User.findOne({ email }).select('+password');

  if (existingUser && existingUser.password) {
    return res.status(200).json({ success: true, requiresPassword: true });
  }

  // Not an existing user or doesn't have a password set yet -> Send OTP
  const otp = generateOTP();

  // Save to MongoDB with auto-expiration (TTL index sets the deletion time)
  try {
    // Delete any existing OTP for this email first
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });
  } catch (dbErr) {
    console.error('DB Error saving OTP:', dbErr);
    return res.status(500).json({ error: 'Failed to generate OTP. Please try again later.' });
  }

  // Try to send email (fallback to console in dev)
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: `"Skill Swap" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your SkillSwap OTP',
        html: `<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;background:#16161F;color:#F0F0FF;border-radius:16px;">
          <h2 style="color:#7B61FF;">Your OTP Code</h2>
          <p style="font-size:36px;letter-spacing:8px;font-weight:bold;color:#FF4ECD;">${otp}</p>
          <p>This code expires in 10 minutes.</p>
        </div>`,
      });
    } else {
      // Dev mode: log OTP to console
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }
  } catch (err) {
    console.error('Email error:', err);
  }

  res.status(200).json({ success: true, message: 'OTP sent', requiresOtp: true });
}
