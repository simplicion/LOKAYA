import { Router } from 'express';
import { validateRequest } from '../../../shared/middleware/validate';
import { AuthService } from '../application/auth.service';
import { 
  registerSchema, 
  loginSchema, 
  googleLoginSchema,
  refreshTokenSchema
} from '../domain/schemas';

export const authRouter = Router();
const authService = new AuthService();

authRouter.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
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
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
