import { Request, Response } from 'express';
import { prisma } from '@workspace/db';

export class CategoryController {
  
  createCategory = async (req: Request, res: Response) => {
    try {
      let storeId, name, imageUrl, isActive, description, displayOrder;
      
      // Handle both nested { storeId, body: { ... } } and flat object payloads
      if (req.body.body) {
        storeId = req.body.storeId;
        ({ name, imageUrl, isActive, description, displayOrder } = req.body.body);
      } else {
        ({ storeId, name, imageUrl, isActive, description, displayOrder } = req.body);
      }
      
      const category = await prisma.category.create({
        data: {
          storeId,
          name,
          imageUrl,
          description,
          ...(displayOrder !== undefined && { displayOrder }),
          ...(isActive !== undefined && { isActive }),
        }
      });
      
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getStoreCategories = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      
      const categories = await prisma.category.findMany({
        where: { storeId },
        orderBy: { displayOrder: 'asc' }
      });
      
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let name, imageUrl, isActive, description, displayOrder;
      
      if (req.body.body) {
        ({ name, imageUrl, isActive, description, displayOrder } = req.body.body);
      } else {
        ({ name, imageUrl, isActive, description, displayOrder } = req.body);
      }
      
      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(description !== undefined && { description }),
          ...(displayOrder !== undefined && { displayOrder }),
          ...(isActive !== undefined && { isActive }),
        }
      });
      
      res.status(200).json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await prisma.category.delete({
        where: { id },
      });
      
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
