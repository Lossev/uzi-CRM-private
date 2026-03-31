import { Router } from 'express';
import { getAvailableSlots, publicBooking, getServices } from '../controllers/publicController';
import { validateBody } from '../middleware/validation';
import { publicBookingSchema } from '../types';

const router = Router();

router.get('/services', getServices);
router.get('/slots', getAvailableSlots);
router.post('/book', validateBody(publicBookingSchema), publicBooking);

export default router;
