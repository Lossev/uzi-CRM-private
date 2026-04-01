import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/authRoutes';
import publicRoutes from './routes/publicRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import clientRoutes from './routes/clientRoutes';
import serviceRoutes from './routes/serviceRoutes';
import statsRoutes from './routes/statsRoutes';
import recurringRoutes from './routes/recurringRoutes';
import waitlistRoutes from './routes/waitlistRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/waitlist', waitlistRoutes);

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
