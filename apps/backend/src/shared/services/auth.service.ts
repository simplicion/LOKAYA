import { prisma, Role } from '@workspace/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export class AuthService {
  async registerUser(email: string, password: string, name: string, role?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Validate role
    let assignedRole: Role = Role.USER;
    if (role && Object.values(Role).includes(role as Role)) {
      assignedRole = role as Role;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: assignedRole,
        authProvider: 'LOCAL'
      },
    });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user: userWithoutPassword };
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

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async googleLogin(payload: any, role?: string) {
    const { email, name, sub: googleId } = payload;
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      let assignedRole: Role = Role.USER;
      if (role && Object.values(Role).includes(role as Role)) {
        assignedRole = role as Role;
      }
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          role: assignedRole,
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

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword, isNewUser };
  }

  async loginWithPhone(phone: string, role?: string) {
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      let assignedRole: Role = Role.USER;
      if (role && Object.values(Role).includes(role as Role)) {
        assignedRole = role as Role;
      }
      user = await prisma.user.create({
        data: {
          phone,
          name: 'User', // Generic name since we only have phone
          role: assignedRole,
          authProvider: 'PHONE'
        }
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }
}
