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
      
      if (!query || query.trim() === '') {
        res.status(200).json({ success: true, data: { users: [], stores: [], products: [] } });
        return;
      }

      const results = await this.searchService.globalSearch(query);
      
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
}
