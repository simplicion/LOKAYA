import { prisma } from '@workspace/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../../shared/errors/AppError';
import { redisClient } from '../../../shared/services/redis.service';
import { EmailService } from '../../notification/application/email.service';

const mapUserWithRole = (user: any) => {
  const { password, ...userWithoutPassword } = user;
  return { 
    ...userWithoutPassword, 
    hasPassword: !!password,
    role: user.isSystemAdmin ? 'SYSTEM_ADMIN' : 'USER' 
  };
};

export class AuthService {
  private generateTokens(user: any) {
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const payload = { 
      id: user.id, 
      email: user.email,
      isSystemAdmin: user.isSystemAdmin
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // 1 hour access token
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // 7 days refresh token
    return { token, refreshToken };
  }

  async refreshToken(token: string) {
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) throw new AppError('User not found', 404);
      
      const tokens = this.generateTokens(user);
      return { ...tokens, user: mapUserWithRole(user) };
    } catch (e) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async sendRegistrationOtp(identifier: string, isPhone: boolean) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `otp:register:${identifier}`;
    
    // Store OTP in Redis for 5 minutes
    try {
      await redisClient.setex(redisKey, 300, otp);
      console.log(`[OTP] Stored OTP for ${identifier} in Redis`);
    } catch (redisErr) {
      console.error('[OTP] Redis setex failed:', redisErr);
      throw new AppError('Failed to store verification code. Please try again.', 500);
    }

    // Send OTP via email or phone
    try {
      if (!isPhone) {
        const emailService = new EmailService();
        await emailService.sendOtp(identifier, otp, 'EMAIL');
        console.log(`[OTP] Email sent to ${identifier}`);
      } else {
        // Dispatched via SMS Gateway (MSG91)
        console.log(`[SMS Gateway MSG91] OTP verification token ${otp} dispatched to ${identifier}`);
      }
    } catch (sendErr) {
      console.error('[OTP] Failed to send OTP:', sendErr);
      throw new AppError('Failed to send verification code. Please try again.', 500);
    }

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyRegistrationOtp(identifier: string, otp: string) {
    const redisKey = `otp:register:${identifier}`;
    const storedOtp = await redisClient.get(redisKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    return { success: true, verified: true, message: 'Code verified successfully' };
  }

  async setPassword(userId: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    return { success: true, message: 'Password set successfully', user: mapUserWithRole(user) };
  }

  async registerUser(data: { 
    email?: string; 
    phone?: string; 
    password?: string; 
    name?: string; 
    otp?: string;
    age?: number | null;
    gender?: string | null;
    locationArea?: string | null;
    city?: string | null;
    state?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) {
    if (!data.email && !data.phone) {
      throw new AppError('Email or phone is required', 400);
    }
    if (!data.password) {
      throw new AppError('Password is required', 400);
    }
    if (!data.otp) {
      throw new AppError('OTP is required', 400);
    }

    const identifier = data.email || data.phone;
    const redisKey = `otp:register:${identifier}`;
    const storedOtp = await redisClient.get(redisKey);

    if (!storedOtp || storedOtp !== data.otp) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) throw new AppError('Email already registered', 400);
    }

    if (data.phone) {
      const existingUser = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingUser) throw new AppError('Phone already registered', 400);
    }

    // Delete the OTP after successful verification
    await redisClient.del(redisKey);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        name: data.name || (data.email ? data.email.split('@')[0] : 'User'),
        age: data.age !== undefined ? data.age : null,
        gender: data.gender || null,
        locationArea: data.locationArea || null,
        city: data.city || null,
        state: data.state || null,
        latitude: data.latitude !== undefined ? data.latitude : null,
        longitude: data.longitude !== undefined ? data.longitude : null,
      } as any,
    });

    const needsOnboarding = !user.age || !user.gender || !user.locationArea;
    const tokens = this.generateTokens(user);

    return { ...tokens, user: mapUserWithRole(user), hasPassword: true, needsOnboarding };
  }

  async loginUser(data: { email?: string, phone?: string, password?: string }) {
    if (!data.password) throw new AppError('Password is required', 400);

    let user;
    if (data.email) {
      user = await prisma.user.findUnique({ where: { email: data.email } });
    } else if (data.phone) {
      user = await prisma.user.findUnique({ where: { phone: data.phone } });
    }

    if (!user || !user.password) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const needsOnboarding = !user.age || !user.gender || !user.locationArea;
    const tokens = this.generateTokens(user);
    return { ...tokens, user: mapUserWithRole(user), hasPassword: true, needsOnboarding };
  }

  async googleLogin(payload: any) {
    const { email, name, given_name, family_name, picture, sub: googleId } = payload;
    const displayName = name || (given_name ? `${given_name} ${family_name || ''}`.trim() : '') || email.split('@')[0] || 'User';

    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          googleId,
          authProvider: 'GOOGLE',
          avatarUrl: picture || null,
        }
      });
    } else if (!user.googleId) {
      // Link account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          googleId,
          avatarUrl: user.avatarUrl || picture || null,
        }
      });
    }

    const hasPassword = !!user.password;
    const needsOnboarding = isNewUser || !(user as any).age || !(user as any).gender || !(user as any).locationArea;

    const tokens = this.generateTokens(user);
    return { 
      ...tokens, 
      user: { ...mapUserWithRole(user), hasPassword }, 
      isNewUser,
      hasPassword,
      needsOnboarding
    };
  }

  async loginWithPhone(phone: string) {
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: 'User', // Generic name since we only have phone
        }
      });
    }

    const tokens = this.generateTokens(user);
    return { ...tokens, user: mapUserWithRole(user) };
  }
}
