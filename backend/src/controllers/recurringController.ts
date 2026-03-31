import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../types';

export const getRecurringAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, isActive } = req.query;

    const where: any = {};
    if (staffId) where.staffId = Number(staffId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const recurring = await prisma.recurringAppointment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, price: true, duration: true } },
        staff: { select: { id: true, name: true } },
        appointments: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(recurring);
  } catch (error) {
    console.error('Get recurring appointments error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getRecurringAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const recurring = await prisma.recurringAppointment.findUnique({
      where: { id: Number(id) },
      include: {
        client: true,
        service: true,
        staff: { select: { id: true, name: true } },
        appointments: {
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    });

    if (!recurring) {
      return res.status(404).json({ error: 'Повторяющаяся запись не найдена' });
    }

    res.json(recurring);
  } catch (error) {
    console.error('Get recurring appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getNextOccurrences = (
  startDate: Date,
  dayOfWeek: number,
  recurringType: string,
  count: number = 10
): Date[] => {
  const dates: Date[] = [];
  let current = new Date(startDate);
  
  current.setDate(current.getDate() + ((dayOfWeek + 7 - current.getDay()) % 7));
  if (current <= startDate) {
    current.setDate(current.getDate() + 7);
  }

  for (let i = 0; i < count; i++) {
    dates.push(new Date(current));
    switch (recurringType) {
      case 'WEEKLY':
        current.setDate(current.getDate() + 7);
        break;
      case 'BIWEEKLY':
        current.setDate(current.getDate() + 14);
        break;
      case 'MONTHLY':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return dates;
};

export const createRecurringAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      clientId,
      serviceId,
      staffId,
      startTime,
      recurringType,
      dayOfWeek,
      endType,
      endDate,
      maxOccurrences,
      price,
      notes,
      createInitial,
    } = req.body;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(400).json({ error: 'Услуга не найдена' });
    }

    const recurring = await prisma.recurringAppointment.create({
      data: {
        clientId,
        serviceId,
        staffId,
        startTime,
        duration: service.duration,
        recurringType: recurringType || 'WEEKLY',
        dayOfWeek,
        endType: endType || 'NEVER',
        endDate: endDate ? new Date(endDate) : null,
        maxOccurrences: maxOccurrences || null,
        price: price || service.price,
        notes,
      },
      include: {
        client: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    if (createInitial) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxApps = endType === 'AFTER_OCCURRENCES' ? maxOccurrences : 10;
      const occurrences = getNextOccurrences(today, dayOfWeek, recurringType, maxApps);

      const appointmentsToCreate = occurrences
        .filter(date => {
          if (endType === 'ON_DATE' && endDate && date > new Date(endDate)) {
            return false;
          }
          return true;
        })
        .slice(0, maxApps || 10);

      for (const date of appointmentsToCreate) {
        const appointmentDate = new Date(date);
        appointmentDate.setHours(hours, minutes, 0, 0);

        await prisma.appointment.create({
          data: {
            clientId,
            serviceId,
            staffId,
            date: appointmentDate,
            price: price || service.price,
            notes,
            recurringId: recurring.id,
          },
        });
      }

      await prisma.recurringAppointment.update({
        where: { id: recurring.id },
        data: { currentCount: appointmentsToCreate.length },
      });
    }

    res.status(201).json(recurring);
  } catch (error) {
    console.error('Create recurring appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateRecurringAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, notes, endTime, endType, endDate, maxOccurrences } = req.body;

    const recurring = await prisma.recurringAppointment.update({
      where: { id: Number(id) },
      data: {
        isActive,
        notes,
        endType,
        endDate: endDate ? new Date(endDate) : null,
        maxOccurrences,
      },
      include: {
        client: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    res.json(recurring);
  } catch (error) {
    console.error('Update recurring appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const deleteRecurringAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deleteFuture } = req.query;

    if (deleteFuture === 'true') {
      await prisma.appointment.deleteMany({
        where: {
          recurringId: Number(id),
          date: { gte: new Date() },
          status: 'SCHEDULED',
        },
      });
    }

    await prisma.recurringAppointment.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete recurring appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const generateRecurringAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { weeksAhead = 4 } = req.body;

    const recurring = await prisma.recurringAppointment.findUnique({
      where: { id: Number(id) },
      include: { service: true },
    });

    if (!recurring || !recurring.isActive) {
      return res.status(404).json({ error: 'Повторяющаяся запись не найдена или неактивна' });
    }

    const [hours, minutes] = recurring.startTime.split(':').map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + weeksAhead * 7);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        recurringId: recurring.id,
        date: { gte: today },
      },
      select: { date: true },
    });

    const existingDates = new Set(
      existingAppointments.map(a => a.date.toISOString().split('T')[0])
    );

    const occurrences = getNextOccurrences(
      today,
      recurring.dayOfWeek,
      recurring.recurringType,
      weeksAhead + 2
    );

    let created = 0;
    for (const date of occurrences) {
      if (date > maxDate) break;
      if (recurring.endType === 'ON_DATE' && recurring.endDate && date > recurring.endDate) break;
      
      const dateStr = date.toISOString().split('T')[0];
      if (existingDates.has(dateStr)) continue;

      const appointmentDate = new Date(date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      await prisma.appointment.create({
        data: {
          clientId: recurring.clientId,
          serviceId: recurring.serviceId,
          staffId: recurring.staffId,
          date: appointmentDate,
          price: recurring.price || recurring.service.price,
          notes: recurring.notes,
          recurringId: recurring.id,
        },
      });
      created++;
    }

    await prisma.recurringAppointment.update({
      where: { id: recurring.id },
      data: { currentCount: { increment: created } },
    });

    res.json({ success: true, created });
  } catch (error) {
    console.error('Generate recurring appointments error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
