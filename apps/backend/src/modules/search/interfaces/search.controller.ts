import { Request, Response } from 'express';
import { SearchService } from '../application/search.service';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  public globalSearch = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      if (!query || query.trim() === '') {
        res.status(200).json({ success: true, data: { users: [], stores: [], products: [], posts: [] } });
        return;
      }

      const results = await this.searchService.globalSearch(query, { page, limit });
      
      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while searching'
      });
    }
  };

  public getTrending = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.searchService.getTrending();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Trending search error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching trending search data'
      });
    }
  };
}
