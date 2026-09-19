import { Router, Request, Response, NextFunction } from 'express';
import { CurrencyService } from './currency.service';

const router = Router();

/**
 * GET /api/v1/meta/currency-rates
 * Returns live Forex rates from open.er-api.com
 */
router.get('/currency-rates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const base = (req.query.base as string) || 'INR';
    const rates = await CurrencyService.getLiveRates(base);
    
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour client cache
    res.json({
      success: true,
      base,
      rates,
      timestamp: Date.now(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/meta/convert-currency
 * Converts amount from one currency to another in real-time
 */
router.post('/convert-currency', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, from, to } = req.body;
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid numeric amount is required' });
    }

    const conversion = await CurrencyService.convert(amount, from || 'INR', to || 'INR');
    res.json({
      success: true,
      ...conversion,
    });
  } catch (error) {
    next(error);
  }
});

export const metaRoutes = router;
