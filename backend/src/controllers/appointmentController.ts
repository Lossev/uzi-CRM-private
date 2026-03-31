import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, CreateAppointmentInput, UpdateAppointmentInput } from '../types';

export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, status, clientId, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (startDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      where.date = { ...where.date, gte: start };
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }
    if (status) {
      where.status = status;
    }
    if (clientId) {
      where.clientId = parseInt(clientId as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          client: true,
          service: true,
          staff: { select: { id: true, name: true } },
        },
        orderBy: { date: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      appointments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        service: true,
        staff: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as CreateAppointmentInput;

    const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
    const slotDuration = settings?.slotDuration || 30;

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        date: {
          gte: new Date(new Date(data.date).getTime() - slotDuration * 60000 + 1),
          lt: new Date(new Date(data.date).getTime() + slotDuration * 60000),
        },
        status: { not: 'CANCELLED' },
        id: { not: undefined },
      },
    });

    if (conflictingAppointment) {
      return res.status(409).json({ 
        error: 'Это время уже занято',
        code: 'SLOT_TAKEN'
      });
    }

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });

    const appointment = await prisma.appointment.create({
      data: {
        clientId: data.clientId,
        serviceId: data.serviceId,
        staffId: req.userId!,
        date: new Date(data.date),
        notes: data.notes,
        price: service?.price,
      },
      include: {
        client: true,
        service: true,
        staff: { select: { id: true, name: true } },
      },
    });

    await prisma.actionLog.create({
      data: {
        userId: req.userId!,
        action: 'CREATE',
        entityType: 'Appointment',
        entityId: appointment.id,
        details: JSON.stringify({ date: appointment.date, clientName: appointment.client.name }),
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body as UpdateAppointmentInput;

    if (req.userRole === 'ASSISTANT' && (data.price !== undefined)) {
      return res.status(403).json({ error: 'У вас нет прав на изменение цены' });
    }

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    if (data.date) {
      const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
      const slotDuration = settings?.slotDuration || 30;

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          date: {
            gte: new Date(new Date(data.date).getTime() - slotDuration * 60000 + 1),
            lt: new Date(new Date(data.date).getTime() + slotDuration * 60000),
          },
          status: { not: 'CANCELLED' },
          id: { not: parseInt(id) },
        },
      });

      if (conflictingAppointment) {
        return res.status(409).json({ 
          error: 'Это время уже занято',
          code: 'SLOT_TAKEN'
        });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        client: true,
        service: true,
        staff: { select: { id: true, name: true } },
      },
    });

    await prisma.actionLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE',
        entityType: 'Appointment',
        entityId: appointment.id,
        details: JSON.stringify({ changes: data }),
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Только администратор может удалять записи' });
    }

    const { id } = req.params;

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' },
    });

    await prisma.actionLog.create({
      data: {
        userId: req.userId!,
        action: 'DELETE',
        entityType: 'Appointment',
        entityId: appointment.id,
        details: JSON.stringify({ previousStatus: appointment.status }),
      },
    });

    res.json({ message: 'Запись отменена', appointment });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getTodayStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointments, tomorrowAppointments, completedRevenue] = await Promise.all([
      prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.appointment.count({
        where: {
          date: { gte: tomorrow, lt: new Date(tomorrow.getTime() + 86400000) },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.appointment.aggregate({
        where: {
          status: 'COMPLETED',
          date: { gte: today, lt: tomorrow },
          price: { not: null },
        },
        _sum: { price: true },
      }),
    ]);

    res.json({
      todayAppointments,
      tomorrowAppointments,
      todayRevenue: completedRevenue._sum.price || 0,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
