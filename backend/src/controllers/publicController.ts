import { Response } from 'express';
import prisma from '../prisma';
import { PublicBookingInput } from '../types';

export const getAvailableSlots = async (req: any, res: Response) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ error: 'Не указаны дата или услуга' });
    }

    const selectedDate = new Date(date as string);
    const serviceIdNum = parseInt(serviceId as string);

    const service = await prisma.service.findUnique({ where: { id: serviceIdNum } });
    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return res.status(500).json({ error: 'Настройки расписания не найдены' });
    }

    const dayOfWeek = selectedDate.getDay();
    const workDays = settings.workDays.split(',').map(Number);
    
    if (!workDays.includes(dayOfWeek)) {
      return res.json({ slots: [], message: 'Нерабочий день' });
    }

    const [startHour, startMinute] = settings.workStartTime.split(':').map(Number);
    const [endHour, endMinute] = settings.workEndTime.split(':').map(Number);
    
    const workStart = new Date(selectedDate);
    workStart.setHours(startHour, startMinute, 0, 0);
    
    const workEnd = new Date(selectedDate);
    workEnd.setHours(endHour, endMinute, 0, 0);

    let breakStart: Date | null = null;
    let breakEnd: Date | null = null;
    
    if (settings.breakStart && settings.breakEnd) {
      const [bh, bm] = settings.breakStart.split(':').map(Number);
      const [beh, bem] = settings.breakEnd.split(':').map(Number);
      breakStart = new Date(selectedDate);
      breakStart.setHours(bh, bm, 0, 0);
      breakEnd = new Date(selectedDate);
      breakEnd.setHours(beh, bem, 0, 0);
    }

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELLED' },
      },
    });

    const slots: string[] = [];
    const slotDuration = settings.slotDuration;
    const serviceDuration = service.duration;

    let currentTime = new Date(workStart);
    
    while (currentTime < workEnd) {
      const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);
      
      if (slotEnd > workEnd) break;

      const isInBreak = breakStart && breakEnd && 
        currentTime < breakEnd && slotEnd > breakStart;

      if (!isInBreak) {
        const isSlotTaken = existingAppointments.some((apt) => {
          const aptTime = new Date(apt.date);
          return Math.abs(aptTime.getTime() - currentTime.getTime()) < slotDuration * 60000;
        });

        if (!isSlotTaken) {
          const now = new Date();
          if (currentTime > now) {
            slots.push(currentTime.toISOString());
          }
        }
      }

      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    res.json({ slots, service });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const publicBooking = async (req: any, res: Response) => {
  try {
    const { name, phone, serviceId, date } = req.body as PublicBookingInput;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELLED' },
      },
    });

    const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
    const slotDuration = settings?.slotDuration || 30;

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        date: {
          gte: new Date(appointmentDate.getTime() - slotDuration * 60000 + 1),
          lt: new Date(appointmentDate.getTime() + slotDuration * 60000),
        },
        status: { not: 'CANCELLED' },
      },
    });

    if (conflictingAppointment) {
      return res.status(409).json({ 
        error: 'Это время уже занято. Пожалуйста, выберите другое время.',
        code: 'SLOT_TAKEN'
      });
    }

    let client = await prisma.client.findUnique({ where: { phone } });
    
    if (!client) {
      client = await prisma.client.create({
        data: { name, phone },
      });
    } else {
      await prisma.client.update({
        where: { id: client.id },
        data: { name },
      });
    }

    const admin = await prisma.user.findFirst({ 
      where: { role: 'ADMIN' },
    });

    const appointment = await prisma.appointment.create({
      data: {
        clientId: client.id,
        serviceId,
        staffId: admin?.id || 1,
        date: appointmentDate,
        price: service.price,
      },
      include: {
        client: true,
        service: true,
      },
    });

    res.status(201).json({
      message: 'Запись успешно создана',
      appointment: {
        id: appointment.id,
        date: appointment.date,
        client: appointment.client,
        service: appointment.service,
      },
    });
  } catch (error) {
    console.error('Public booking error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getServices = async (req: any, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
