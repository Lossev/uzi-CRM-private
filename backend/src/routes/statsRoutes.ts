import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth';
import {
  getRevenueStats,
  getDashboardStats,
  getScheduleSettings,
  updateScheduleSettings,
  sendRevenueReport,
  getEmailSettings,
  updateEmailSettings,
  testEmailSettings,
  getTelegramSettings,
  updateTelegramSettings,
  testTelegramSettings,
  getReportSettings,
  updateReportSettings,
} from '../controllers/statsController';
import { validateBody } from '../middleware/validation';
import { updateScheduleSchema, sendReportSchema, emailSettingsSchema, telegramSettingsSchema, reportSettingsSchema } from '../types';

const router = Router();

router.use(authenticate, requireStaff);

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueStats);
router.post('/revenue/send-report', validateBody(sendReportSchema), sendRevenueReport);
router.get('/schedule', getScheduleSettings);
router.put('/schedule', validateBody(updateScheduleSchema), updateScheduleSettings);
router.get('/email', getEmailSettings);
router.put('/email', validateBody(emailSettingsSchema), updateEmailSettings);
router.post('/email/test', testEmailSettings);
router.get('/telegram', getTelegramSettings);
router.put('/telegram', validateBody(telegramSettingsSchema), updateTelegramSettings);
router.post('/telegram/test', testTelegramSettings);
router.get('/report', getReportSettings);
router.put('/report', validateBody(reportSettingsSchema), updateReportSettings);

export default router;
