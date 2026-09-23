import { Router } from 'express';
import { SearchController } from './search.controller';

const router: Router = Router();
const searchController = new SearchController();

// GET /api/v1/search/trending
router.get('/trending', searchController.getTrending);

// GET /api/v1/search?q=query
router.get('/', searchController.globalSearch);

export default router;
