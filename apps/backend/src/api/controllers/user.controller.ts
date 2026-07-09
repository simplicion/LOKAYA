import { Request, Response } from 'express';
import { prisma } from '@workspace/db';
import bcrypt from 'bcryptjs';

export class UserController {
  updateProfile = async (req: Request, res: Response) => {
    try {
      const { userId, phone, password, name } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      let updateData: any = {};
      
      if (phone) {
        updateData.phone = phone;
      }
      
      if (name) {
        updateData.name = name;
      }
      
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, email: true, phone: true, name: true, role: true }
      });

      res.status(200).json(updatedUser);
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      // Handle Prisma Unique Constraint Violation
      if (error.code === 'P2002') {
        const target = error.meta?.target?.[0] || 'Field';
        return res.status(400).json({ 
          error: `${target === 'phone' ? 'Phone number' : target} is already in use by another account.` 
        });
      }

      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  };
}
