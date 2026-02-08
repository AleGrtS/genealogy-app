import { Router } from 'express';
import * as relationshipController from '../controllers/relationship.controller';

const router = Router();

// GET /api/relationships - все отношения
router.get('/', relationshipController.getAllRelationships);

// POST /api/relationships - создать отношение
router.post('/', relationshipController.createRelationship);

// GET /api/relationships/person/:id - отношения человека
router.get('/person/:id', relationshipController.getPersonRelationships);

// DELETE /api/relationships/:id - удалить отношение
router.delete('/:id', relationshipController.deleteRelationship);

export default router;
