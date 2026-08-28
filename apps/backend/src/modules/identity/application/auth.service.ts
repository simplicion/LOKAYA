import { prisma } from '@workspace/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../../shared/errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export class AuthService {
  private generateTokens(user: any) {
    const payload = { 
      id: user.id, 
      email: user.email,
      isSystemAdmin: user.isSystemAdmin
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // 1 hour access token
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // 7 days refresh token
    return { token, refreshToken };
  }

  async registerUser(data: { email?: string, phone?: string, password?: string, name?: string }) {
    if (!data.email && !data.phone) {
      throw new AppError('Email or phone is required', 400);
    }
    if (!data.password) {
      throw new AppError('Password is required', 400);
    }

    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) throw new AppError('Email already registered', 400);
    }

    if (data.phone) {
      const existingUser = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingUser) throw new AppError('Phone already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        name: data.name || 'User',
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    const tokens = this.generateTokens(user);

    return { ...tokens, user: userWithoutPassword };
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

    const tokens = this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;
    return { ...tokens, user: userWithoutPassword };
  }

  async googleLogin(payload: any) {
    const { email, name, sub: googleId } = payload;
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
        }
      });
    } else if (!user.googleId) {
      // Link account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId }
      });
    }

    const tokens = this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;
    return { ...tokens, user: userWithoutPassword, isNewUser };
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
    const { password: _, ...userWithoutPassword } = user;
    return { ...tokens, user: userWithoutPassword };
  }
}
