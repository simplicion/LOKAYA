import { Router } from 'express';
import { validateRequest } from '../../../shared/middleware/validate';
import { AuthService } from '../application/auth.service';
import { requireAuth } from '../../../shared/middleware/auth';
import { prisma } from '@workspace/db';
import { 
  registerSchema, 
  loginSchema, 
  googleLoginSchema,
  refreshTokenSchema,
  sendOtpSchema
} from '../domain/schemas';

export const authRouter: Router = Router();
const authService = new AuthService();


const setTokenCookies = (res: any, token: string, refreshToken: string) => {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

authRouter.post('/send-otp', validateRequest(sendOtpSchema), async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    const identifier = email || phone;
    const isPhone = !!phone;
    
    // For now we don't throw error if user exists because they might be logging in or resetting password.
    // However, the current flow is mainly for registration.
    
    const result = await authService.sendRegistrationOtp(identifier, isPhone);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    setTokenCookies(res, result.token, result.refreshToken);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    setTokenCookies(res, result.token, result.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/google', validateRequest(googleLoginSchema), async (req, res, next) => {
  try {
    const { token } = req.body;
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const payload = await response.json();
    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token payload' });
    }

    const result = await authService.googleLogin(payload);
    setTokenCookies(res, result.token, result.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.status(200).json({ message: 'Logged out successfully' });
});

authRouter.get('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }
    const result = await authService.refreshToken(refreshToken);
    setTokenCookies(res, result.token, result.refreshToken);
    res.status(200).json({ user: result.user });
  } catch (error) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            reels: true,
            orders: true
          }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { password, ...userWithoutPassword } = user;
    const mappedUser = { ...userWithoutPassword, role: user.isSystemAdmin ? 'SYSTEM_ADMIN' : 'USER' };
    
    res.status(200).json({ user: mappedUser });
  } catch (error) {
    next(error);
  }
});

authRouter.put('/profile', requireAuth, async (req: any, res, next) => {
  try {
    const { name, avatarUrl } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = user;
    const mappedUser = { ...userWithoutPassword, role: user.isSystemAdmin ? 'SYSTEM_ADMIN' : 'USER' };

    res.status(200).json({ user: mappedUser });
  } catch (error) {
    next(error);
  }
});

// Address Management
authRouter.get('/addresses', requireAuth, async (req: any, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
    res.status(200).json(addresses);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/addresses', requireAuth, async (req: any, res, next) => {
  try {
    const { name, phone, addressLine1, addressLine2, city, state, pincode, type, isDefault } = req.body;
    
    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Missing required address fields' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    const existingCount = await prisma.address.count({ where: { userId: req.user.id } });

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,
        name,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        type: type || 'HOME',
        isDefault: isDefault !== undefined ? isDefault : existingCount === 0
      }
    });

    res.status(201).json(newAddress);
  } catch (error) {
    next(error);
  }
});

authRouter.put('/addresses/:id', requireAuth, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, addressLine1, addressLine2, city, state, pincode, type, isDefault } = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(addressLine1 && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(type && { type }),
        ...(isDefault !== undefined && { isDefault })
      }
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

authRouter.delete('/addresses/:id', requireAuth, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await prisma.address.delete({ where: { id } });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

