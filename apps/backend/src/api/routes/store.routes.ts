import { Router } from 'express';
import { StoreController } from '../controllers/store.controller';

const router = Router();
const storeController = new StoreController();

router.get('/pending', storeController.getPendingStores);
router.patch('/:storeId/verify', storeController.verifyStore);

router.get('/', storeController.getAllStores);
router.post('/onboard', storeController.onboardStore);
router.get('/my-store/:userId', storeController.getMyStore);
router.get('/:storeId', storeController.getStore);
router.put('/:storeId/profile', storeController.updateStoreProfile);

export default router;
