import { Router } from 'express';
import * as photoController from '../controllers/photo.controller';

const router = Router();

// POST /api/photos/:personId - загрузить фото
router.post('/:personId', photoController.uploadSingle, photoController.uploadPhoto);

// GET /api/photos/:personId - получить все фото человека
router.get('/:personId', photoController.getPersonPhotos);

// DELETE /api/photos/:id - удалить фото
router.delete('/:id', photoController.deletePhoto);

// PUT /api/photos/:id/main - установить как главное
router.put('/:id/main', photoController.setMainPhoto);

export default router;
