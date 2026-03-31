import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getTodayStats,
} from '../controllers/appointmentController';
import { validateBody } from '../middleware/validation';
import { createAppointmentSchema, updateAppointmentSchema } from '../types';

const router = Router();

router.use(authenticate, requireStaff);

router.get('/', getAppointments);
router.get('/stats/today', getTodayStats);
router.get('/:id', getAppointment);
router.post('/', validateBody(createAppointmentSchema), createAppointment);
router.put('/:id', validateBody(updateAppointmentSchema), updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
