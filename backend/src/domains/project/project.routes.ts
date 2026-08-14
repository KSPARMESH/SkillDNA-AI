import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All project routes require valid JWT authentication
router.use(authenticate);

router.post('/', ProjectController.create);
router.get('/', ProjectController.list);
router.get('/:id', ProjectController.getById);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);

export default router;
