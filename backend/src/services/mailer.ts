import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

let transporter: nodemailer.Transporter | null = null;

if (config.email.host && config.email.user) {
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
}

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  const verificationUrl = `${config.clientUrl}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #0b0f17; color: #f1f5f9; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto;">
      <h1 style="color: #17ab7e; margin-bottom: 20px;">PRIVATE KERNEL</h1>
      <p>Hello ${name},</p>
      <p>Welcome to PRIVATE KERNEL. To verify your email address and activate your account, please click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #17ab7e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">Or paste this link into your browser: <br/><a href="${verificationUrl}" style="color: #3ec698;">${verificationUrl}</a></p>
      <p style="color: #64748b; font-size: 12px; margin-top: 40px; border-top: 1px solid #1f2a3f; padding-top: 20px;">If you didn't request this account, you can safely ignore this email.</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Verify your email - PRIVATE KERNEL',
      html
    });
  } else {
    console.log(`\n================ EMAIL VERIFICATION LINK ================`);
    console.log(`Recipient: ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log(`=========================================================\n`);
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #0b0f17; color: #f1f5f9; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto;">
      <h1 style="color: #17ab7e; margin-bottom: 20px;">PRIVATE KERNEL</h1>
      <p>You requested a password reset for your PRIVATE KERNEL account.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #17ab7e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">Or paste this link into your browser: <br/><a href="${resetUrl}" style="color: #3ec698;">${resetUrl}</a></p>
      <p style="color: #64748b; font-size: 12px; margin-top: 40px; border-top: 1px solid #1f2a3f; padding-top: 20px;">This link will expire in 1 hour. If you didn't request this, please change your password immediately.</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Reset your password - PRIVATE KERNEL',
      html
    });
  } else {
    console.log(`\n================ PASSWORD RESET LINK ================`);
    console.log(`Recipient: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`=====================================================\n`);
  }
};
