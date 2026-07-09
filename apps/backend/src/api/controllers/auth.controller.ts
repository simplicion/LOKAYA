import { Request, Response } from 'express';
import { AuthService } from '../../shared/services/auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;
      const result = await this.authService.registerUser(email, password, name, role);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.loginUser(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  googleLogin = async (req: Request, res: Response) => {
    try {
      const { token, role } = req.body; // The Google access token from frontend
      if (!token) {
        return res.status(400).json({ error: 'Google token is required' });
      }

      // Verify the Google token by fetching user profile
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Invalid Google token');
      }
      
      const payload = await response.json();
      
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token payload');
      }

      const result = await this.authService.googleLogin(payload, role);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Google login error:', error);
      res.status(401).json({ error: error.message || 'Google login failed' });
    }
  };

  sendOtp = async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // We'd load OtpService lazily here to avoid circular dependencies if any
      const { OtpService } = require('../../shared/services/otp.service');
      const otpService = new OtpService();
      
      const success = await otpService.sendOtp(phone);
      if (success) {
        res.status(200).json({ message: 'OTP sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send OTP' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error sending OTP' });
    }
  };

  verifyOtp = async (req: Request, res: Response) => {
    try {
      const { phone, otp, role } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP are required' });
      }

      const { OtpService } = require('../../shared/services/otp.service');
      const otpService = new OtpService();
      
      const isValid = await otpService.verifyOtp(phone, otp);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      const result = await this.authService.loginWithPhone(phone, role);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error verifying OTP' });
    }
  };

  forgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({ error: 'Email or phone number is required' });
      }

      // Check if user exists first
      const { prisma } = require('@workspace/db');
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { OtpService } = require('../../shared/services/otp.service');
      const otpService = new OtpService();
      
      const success = await otpService.sendOtp(identifier);
      if (success) {
        res.status(200).json({ message: 'OTP sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send OTP' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error sending OTP' });
    }
  };

  verifyForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { identifier, otp } = req.body;
      if (!identifier || !otp) {
        return res.status(400).json({ error: 'Identifier and OTP are required' });
      }

      const { OtpService } = require('../../shared/services/otp.service');
      const otpService = new OtpService();
      
      const isValid = await otpService.verifyOtp(identifier, otp);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      // Return a temporary token (just signing the identifier for simplicity)
      const jwt = require('jsonwebtoken');
      const resetToken = jwt.sign({ identifier }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '15m' });
      
      res.status(200).json({ resetToken });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error verifying OTP' });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { resetToken, password } = req.body;
      if (!resetToken || !password) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      const jwt = require('jsonwebtoken');
      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'supersecret');
      } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired reset token' });
      }

      const identifier = decoded.identifier;

      const { prisma } = require('@workspace/db');
      const bcrypt = require('bcryptjs');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await prisma.user.updateMany({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        },
        data: {
          password: hashedPassword
        }
      });

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error resetting password' });
    }
  };
}
