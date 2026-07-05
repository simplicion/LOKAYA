import { Router } from 'express';
import { StoreController } from '../controllers/store.controller';

const router = Router();
const storeController = new StoreController();

router.get('/', storeController.getAllStores);
router.post('/onboard', storeController.onboardStore);
router.get('/my-store/:userId', storeController.getMyStore);
router.get('/:storeId', storeController.getStore);

export default router;
