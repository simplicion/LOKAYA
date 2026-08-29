import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment is too long')
  })
});

export const reportSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Reason cannot be empty').max(500, 'Reason is too long')
  })
});
