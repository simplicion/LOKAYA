import nodemailer from 'nodemailer';
import { INotificationService } from '../interfaces/INotificationService';
import { AppError } from '../../../shared/errors/AppError';

export class EmailService implements INotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initTransporter();
  }

  private async initTransporter() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log('No SMTP credentials found. Generating Ethereal test account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log('Ethereal test account generated:', testAccount.user);
      } catch (err) {
        console.error('Failed to generate Ethereal account:', err);
      }
    }
  }

  async sendOtp(to: string, otp: string, type: 'EMAIL' | 'PHONE'): Promise<boolean> {
    if (type !== 'EMAIL') {
      console.warn('EmailService is being used to send an OTP to a phone number. Ignoring.');
      return false;
    }

    if (this.initPromise) {
      await this.initPromise;
    }

    if (!this.transporter) {
      console.error('Transporter not initialized.');
      throw new AppError('Email service not initialized', 500);
    }

    try {
      const mailOptions = {
        from: `"LOKAYA" <${process.env.SMTP_FROM_EMAIL || 'no-reply@lokaya.com'}>`,
        to,
        subject: 'Your LOKAYA Verification Code',
        text: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #FF5A36; text-align: center;">Welcome to LOKAYA</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666;">This code is valid for 5 minutes. Please do not share it with anyone.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      
      // If using Ethereal email for testing, log the preview URL
      if (!process.env.SMTP_USER || process.env.SMTP_HOST === 'smtp.ethereal.email') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new AppError('Failed to send verification email', 500);
    }
  }
}
