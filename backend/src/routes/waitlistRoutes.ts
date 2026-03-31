import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth';
import {
  getWaitlist,
  addToWaitlist,
  updateWaitlist,
  removeFromWaitlist,
  convertWaitlistToAppointment,
  checkAvailableSlots,
} from '../controllers/waitlistController';

const router = Router();

router.get('/slots', authenticate, checkAvailableSlots);
router.use(authenticate, requireStaff);

router.get('/', getWaitlist);
router.post('/', addToWaitlist);
router.put('/:id', updateWaitlist);
router.delete('/:id', removeFromWaitlist);
router.post('/:id/convert', convertWaitlistToAppointment);

export default router;
