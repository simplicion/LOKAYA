import { AuthService } from './auth.service';
import { prisma } from '@workspace/db';
import { redisClient } from '../../../shared/services/redis.service';
import { EmailService } from '../../notification/application/email.service';
import bcrypt from 'bcryptjs';

jest.mock('@workspace/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../shared/services/redis.service', () => ({
  redisClient: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../../notification/application/email.service');
jest.mock('bcryptjs');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('sendRegistrationOtp', () => {
    it('should generate an OTP, store it in redis, and send email if not phone', async () => {
      const email = 'test@example.com';
      (EmailService.prototype.sendOtp as jest.Mock).mockResolvedValue(true);
      (redisClient.setex as jest.Mock).mockResolvedValue('OK');

      const result = await authService.sendRegistrationOtp(email, false);

      expect(redisClient.setex).toHaveBeenCalledWith(`otp:register:${email}`, 300, expect.any(String));
      expect(EmailService.prototype.sendOtp).toHaveBeenCalledWith(email, expect.any(String), 'EMAIL');
      expect(result).toEqual({ success: true, message: 'OTP sent successfully' });
    });

    it('should not send email if isPhone is true', async () => {
      const phone = '1234567890';
      (redisClient.setex as jest.Mock).mockResolvedValue('OK');

      const result = await authService.sendRegistrationOtp(phone, true);

      expect(redisClient.setex).toHaveBeenCalledWith(`otp:register:${phone}`, 300, expect.any(String));
      expect(EmailService.prototype.sendOtp).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'OTP sent successfully' });
    });
  });

  describe('registerUser', () => {
    it('should throw an error if OTP is missing', async () => {
      await expect(
        authService.registerUser({ email: 'test@example.com', password: 'password123', name: 'Test User' })
      ).rejects.toThrow('OTP is required');
    });

    it('should throw an error if OTP is invalid', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue('123456');

      await expect(
        authService.registerUser({ email: 'test@example.com', password: 'password123', name: 'Test User', otp: '654321' })
      ).rejects.toThrow('Invalid or expired OTP');
    });

    it('should create a user successfully with valid OTP', async () => {
      const userData = { email: 'test@example.com', password: 'password123', name: 'Test User', otp: '123456' };
      
      (redisClient.get as jest.Mock).mockResolvedValue('123456');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1', ...userData });

      const result = await authService.registerUser(userData);

      expect(redisClient.get).toHaveBeenCalledWith(`otp:register:${userData.email}`);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(redisClient.del).toHaveBeenCalledWith(`otp:register:${userData.email}`);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });
  });
});
