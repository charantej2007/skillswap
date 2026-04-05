import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import nodemailer from 'nodemailer';

const otpStore = global.__otpStore || (global.__otpStore = {});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists — just send success
      return res.status(200).json({ success: true, message: 'If this email exists, an OTP was sent.' });
    }

    if (user.auth_provider === 'google') {
      return res.status(400).json({ error: 'This account uses Google login. Please sign in with Google.' });
    }

    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 min
    // Store with a 'reset' flag so it doesn't mix with signup OTPs
    otpStore[`reset_${email}`] = { otp, expires };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT),
          secure: false,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
          from: `"Skill Swap" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Reset Your SkillSwap Password',
          html: `
            <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:32px;background:#16161F;color:#F0F0FF;border-radius:16px;">
              <h2 style="color:#7B61FF;margin-bottom:8px;">Password Reset</h2>
              <p style="color:rgba(240,240,255,0.7);margin-bottom:24px;">Use this OTP to reset your Skill Swap password. It expires in 10 minutes.</p>
              <div style="background:#0D0D14;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="font-size:40px;letter-spacing:10px;font-weight:bold;color:#FF4ECD;margin:0;">${otp}</p>
              </div>
              <p style="color:rgba(240,240,255,0.5);font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
            </div>`,
        });
      } else {
        console.log(`[DEV] Password Reset OTP for ${email}: ${otp}`);
      }
    } catch (emailErr) {
      console.error('Email send error:', emailErr.message);
    }

    return res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('[/api/auth/forgot-password]', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
