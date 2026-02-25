import { Router } from 'express';
import * as smartRelationshipController from '../controllers/smart-relationship.controller';

const router = Router();

// GET /api/smart/relatives/:id - все родственники человека
router.get('/relatives/:id', smartRelationshipController.getRelatives);

// GET /api/smart/relation/:person1Id/:person2Id - родство между двумя людьми
router.get('/relation/:person1Id/:person2Id', smartRelationshipController.getRelation);

// GET /api/smart/path/:person1Id/:person2Id - путь между двумя людьми
router.get('/path/:person1Id/:person2Id', smartRelationshipController.findPath);

export default router;
