import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();
const categoryController = new CategoryController();

router.post('/', categoryController.createCategory);
router.get('/store/:storeId', categoryController.getStoreCategories);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
