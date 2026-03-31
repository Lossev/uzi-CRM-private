import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth';
import {
  getRevenueStats,
  getDashboardStats,
  getScheduleSettings,
  updateScheduleSettings,
  sendRevenueReport,
} from '../controllers/statsController';
import { validateBody } from '../middleware/validation';
import { updateScheduleSchema, sendReportSchema } from '../types';

const router = Router();

router.use(authenticate, requireStaff);

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueStats);
router.post('/revenue/send-report', validateBody(sendReportSchema), sendRevenueReport);
router.get('/schedule', getScheduleSettings);
router.put('/schedule', validateBody(updateScheduleSchema), updateScheduleSettings);

export default router;
