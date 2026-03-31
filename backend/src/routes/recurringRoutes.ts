import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth';
import {
  getRecurringAppointments,
  getRecurringAppointment,
  createRecurringAppointment,
  updateRecurringAppointment,
  deleteRecurringAppointment,
  generateRecurringAppointments,
} from '../controllers/recurringController';

const router = Router();

router.use(authenticate, requireStaff);

router.get('/', getRecurringAppointments);
router.get('/:id', getRecurringAppointment);
router.post('/', createRecurringAppointment);
router.put('/:id', updateRecurringAppointment);
router.delete('/:id', deleteRecurringAppointment);
router.post('/:id/generate', generateRecurringAppointments);

export default router;
