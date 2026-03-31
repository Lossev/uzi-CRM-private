import { z } from 'zod';
import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const createClientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export const createServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(5).max(120),
  price: z.number().positive(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createAppointmentSchema = z.object({
  clientId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  date: z.string().transform((val) => new Date(val)),
  notes: z.string().optional().nullable(),
});

export const updateAppointmentSchema = z.object({
  clientId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive().optional(),
  date: z.string().transform((val) => new Date(val)).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  price: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const publicBookingSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  serviceId: z.number().int().positive(),
  date: z.string().transform((val) => new Date(val)),
});

export const updateScheduleSchema = z.object({
  workStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  workEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  breakStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  breakEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  slotDuration: z.number().int().min(10).max(120),
  workDays: z.string(),
});

export const sendReportSchema = z.object({
  email: z.string().email().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  telegramChatId: z.string().optional(),
  sendToTelegram: z.boolean().optional(),
  sendToEmail: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type SendReportInput = z.infer<typeof sendReportSchema>;
