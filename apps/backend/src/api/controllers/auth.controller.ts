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
}
