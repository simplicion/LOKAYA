import { Router } from 'express';
import { SearchController } from './search.controller';

const router = Router();
const searchController = new SearchController();

// GET /api/search?q=query
router.get('/', searchController.globalSearch);

export default router;
