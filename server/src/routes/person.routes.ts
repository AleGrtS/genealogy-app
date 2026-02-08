import { Router } from 'express';
import * as personController from '../controllers/person.controller';

const router = Router();

router.get('/', personController.getAllPersons);
router.post('/', personController.createPerson);
router.get('/:id', personController.getPersonById);
router.put('/:id', personController.updatePerson);
router.delete('/:id', personController.deletePerson);

export default router;
