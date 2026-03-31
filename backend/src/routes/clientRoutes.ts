import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController';
import { validateBody } from '../middleware/validation';
import { createClientSchema, updateClientSchema } from '../types';

const router = Router();

router.use(authenticate, requireStaff);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', validateBody(createClientSchema), createClient);
router.put('/:id', validateBody(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);

export default router;
