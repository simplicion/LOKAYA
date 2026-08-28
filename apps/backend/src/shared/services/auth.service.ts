import { prisma } from '@workspace/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export class AuthService {
  private generateTokens(user: any) {
    const payload = { userId: user.id, email: user.email, isSystemAdmin: user.isSystemAdmin };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // 1 hour access token
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // 7 days refresh token
    return { token, refreshToken };
  }
  async registerUser(email: string, password: string, name: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        authProvider: 'LOCAL'
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    const tokens = this.generateTokens(user);

    return { ...tokens, user: userWithoutPassword };
  }

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.password) {
      throw new Error('Please login using the method you signed up with (Google or Phone).');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
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
          authProvider: 'GOOGLE'
        }
      });
    } else if (!user.googleId) {
      // Link account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, authProvider: 'GOOGLE' }
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
          authProvider: 'PHONE'
        }
      });
    }

    const tokens = this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;
    return { ...tokens, user: userWithoutPassword };
  }
}
