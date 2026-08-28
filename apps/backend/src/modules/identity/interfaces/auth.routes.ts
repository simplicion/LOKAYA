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
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
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
