import { Router } from 'express';
import { MediaController } from './media.controller';

export const mediaRouter: Router = Router();
const mediaController = new MediaController();

mediaRouter.post('/presigned-url', mediaController.getPresignedUrl.bind(mediaController));
mediaRouter.post('/process', mediaController.startProcessing.bind(mediaController));
