import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  authenticate,
} from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { addHistoryLog, mapStaff } from '../utils/helpers.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });

    if (!user || user.status !== 'Active') {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const payload = {
      userId: user.id,
      staffId: user.staffId,
      role: user.role,
      name: user.name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    await addHistoryLog('Staff', user.staffId, `User ${user.name} logged in successfully`, user.name);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: mapStaff(user),
    });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.status !== 'Active') {
      res.status(401).json({ error: 'Invalid user' });
      return;
    }

    const payload = {
      userId: user.id,
      staffId: user.staffId,
      role: user.role,
      name: user.name,
    };

    res.cookie('accessToken', signAccessToken(payload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      user: mapStaff(user),
    });
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    if (req.user) {
      await addHistoryLog('Staff', req.user.staffId, `User ${req.user.name} logged out`, req.user.name);
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: mapStaff(user) });
  })
);

async function sendRecoveryEmail(
  to: string,
  userName: string,
  loginUsername: string,
  tempPass: string
): Promise<string | null> {
  let host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;

  const isPlaceholder = !host || !user || !pass || 
                         host.includes('your-smtp-server.com') || 
                         user.includes('your-email@domain.com') ||
                         user.includes('your-email');

  let transporter;

  if (isPlaceholder) {
    console.warn('[EMAIL WARNING] SMTP environment variables are missing. Creating dynamic Ethereal test mailbox...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      host = testAccount.smtp.host;
      user = testAccount.user;
      pass = testAccount.pass;
    } catch (e: any) {
      console.error('[EMAIL ERROR] Failed to create Ethereal test account:', e.message);
      return null;
    }
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
    });

    const mailOptions = {
      from: `"MediCare Recovery" <${user}>`,
      to,
      subject: 'MediCare System Access Credentials Recovery',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">MediCare Management System</h2>
          <p style="font-size: 14px; color: #475569;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; color: #475569;">You are receiving this email because a password recovery request was triggered for your clinic profile.</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #64748b; font-weight: bold; width: 120px;">Username:</td>
                <td style="color: #0f172a; font-family: monospace; font-weight: bold;">${loginUsername}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: bold;">Reset Password:</td>
                <td style="color: #0f172a; font-family: monospace; font-weight: bold; font-size: 16px;">${tempPass}</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 12px; color: #94a3b8; font-style: italic;">Note: Please change this password immediately after logging in from your Settings page to secure your account.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; text-align: center; color: #94a3b8;">© 2026 MediCare Inc. All rights reserved.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (host && host.includes('ethereal.email')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[ETHEREAL INBOX] Ethereal email sent! Preview URL: ${previewUrl}`);
      return previewUrl || null;
    }
    
    return null;
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message || error);
    return null;
  }
}

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) {
      res.status(404).json({ error: 'Please contact the system administrator' });
      return;
    }

    // Generate a temporary recovery password
    const tempPassword = `medicare${Math.floor(1000 + Math.random() * 9000)}`;
    const newHash = await bcrypt.hash(tempPassword, 10);

    // Update the database password Hash
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Send real recovery email
    const previewUrl = await sendRecoveryEmail(email, user.name, user.username, tempPassword);

    await addHistoryLog(
      'Staff',
      user.staffId,
      `Password recovery email sent to ${email} for user ${user.name}. Temp password: ${tempPassword}. ${previewUrl ? 'Preview URL: ' + previewUrl : ''}`,
      'System Recovery'
    );

    res.json({ 
      message: 'Password recovery email sent successfully!',
      previewUrl
    });
  })
);

export default router;
