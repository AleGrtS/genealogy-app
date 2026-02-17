import { Router } from 'express';
import * as personController from '../controllers/person.controller';

const router = Router();

// GET /api/persons - все люди
router.get('/', personController.getAllPersons);

// GET /api/persons/:id - человек по ID
router.get('/:id', personController.getPersonById);

// POST /api/persons - создать человека
router.post('/', personController.createPerson);

// PUT /api/persons/:id - обновить человека
router.put('/:id', personController.updatePerson);

// DELETE /api/persons/:id - удалить человека
router.delete('/:id', personController.deletePerson);

export default router;
