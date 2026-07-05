import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const productController = new ProductController();

router.post('/stores/:storeId/products', productController.addProduct);
router.get('/stores/:storeId/products', productController.getProducts);
router.get('/products/qr/:qrUuid', productController.resolveQr);

export default router;
