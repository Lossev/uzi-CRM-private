import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../types';

export const getWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    const { status, staffId, serviceId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (staffId) where.staffId = Number(staffId);
    if (serviceId) where.serviceId = Number(serviceId);

    const waitlist = await prisma.waitlist.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        staff: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(waitlist);
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const addToWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    const {
      clientId,
      serviceId,
      staffId,
      preferredDate,
      preferredTime,
      notes,
    } = req.body;

    const existing = await prisma.waitlist.findFirst({
      where: {
        clientId,
        serviceId,
        status: 'WAITING',
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Клиент уже в очереди на эту услугу' });
    }

    const waitlistEntry = await prisma.waitlist.create({
      data: {
        clientId,
        serviceId,
        staffId,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime,
        notes,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(waitlistEntry);
  } catch (error) {
    console.error('Add to waitlist error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, preferredDate, preferredTime, notes } = req.body;

    const entry = await prisma.waitlist.update({
      where: { id: Number(id) },
      data: {
        status,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime,
        notes,
        notifiedAt: status === 'NOTIFIED' ? new Date() : undefined,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    res.json(entry);
  } catch (error) {
    console.error('Update waitlist error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const removeFromWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.waitlist.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove from waitlist error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const convertWaitlistToAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, staffId, notes } = req.body;

    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { id: Number(id) },
      include: { service: true },
    });

    if (!waitlistEntry || waitlistEntry.status !== 'WAITING') {
      return res.status(404).json({ error: 'Запись в очереди не найдена' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: waitlistEntry.clientId,
        serviceId: waitlistEntry.serviceId,
        staffId: staffId || waitlistEntry.staffId,
        date: new Date(date),
        price: waitlistEntry.service.price,
        notes: notes || waitlistEntry.notes,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    await prisma.waitlist.update({
      where: { id: Number(id) },
      data: { status: 'CONVERTED' },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Convert waitlist to appointment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const checkAvailableSlots = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, staffId, date } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({ error: 'Укажите serviceId и date' });
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });

    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const settings = await prisma.scheduleSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      return res.status(404).json({ error: 'Настройки расписания не найдены' });
    }

    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.getDay();

    const workDays = settings.workDays.split(',').map(Number);
    if (!workDays.includes(dayOfWeek)) {
      return res.json({ available: false, slots: [], message: 'Нерабочий день' });
    }

    const [startHour, startMin] = settings.workStartTime.split(':').map(Number);
    const [endHour, endMin] = settings.workEndTime.split(':').map(Number);

    const dayStart = new Date(targetDate);
    dayStart.setHours(startHour, startMin, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(endHour, endMin, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: dayStart,
          lt: dayEnd,
        },
        status: { not: 'CANCELLED' },
        ...(staffId ? { staffId: Number(staffId) } : {}),
      },
      orderBy: { date: 'asc' },
    });

    const slots: { time: string; available: boolean }[] = [];
    const slotDuration = settings.slotDuration;
    const serviceDuration = service.duration;

    let currentSlot = new Date(dayStart);

    while (currentSlot < dayEnd) {
      const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);

      if (slotEnd > dayEnd) break;

      const isBreak =
        settings.breakStart && settings.breakEnd &&
        (() => {
          const [bh, bm] = settings.breakStart.split(':').map(Number);
          const [eh, em] = settings.breakEnd.split(':').map(Number);
          const breakStart = new Date(targetDate);
          breakStart.setHours(bh, bm, 0, 0);
          const breakEnd = new Date(targetDate);
          breakEnd.setHours(eh, em, 0, 0);
          return currentSlot < breakEnd && slotEnd > breakStart;
        })();

      const hasConflict = appointments.some(apt => {
        const aptStart = new Date(apt.date);
        const aptEnd = new Date(aptStart.getTime() + serviceDuration * 60000);
        return currentSlot < aptEnd && slotEnd > aptStart;
      });

      slots.push({
        time: currentSlot.toTimeString().slice(0, 5),
        available: !isBreak && !hasConflict,
      });

      currentSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
    }

    res.json({
      available: slots.some(s => s.available),
      slots,
      workHours: {
        start: settings.workStartTime,
        end: settings.workEndTime,
      },
    });
  } catch (error) {
    console.error('Check available slots error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
