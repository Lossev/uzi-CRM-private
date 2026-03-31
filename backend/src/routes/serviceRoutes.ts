import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController';
import { validateBody } from '../middleware/validation';
import { createServiceSchema, updateServiceSchema } from '../types';

const router = Router();

router.get('/', getServices);
router.get('/:id', getService);
router.post('/', authenticate, requireAdmin, validateBody(createServiceSchema), createService);
router.put('/:id', authenticate, requireAdmin, validateBody(updateServiceSchema), updateService);
router.delete('/:id', authenticate, requireAdmin, deleteService);

export default router;
