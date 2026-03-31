import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, CreateServiceInput, UpdateServiceInput } from '../types';

export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
    });

    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as CreateServiceInput;

    const service = await prisma.service.create({
      data,
    });

    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body as UpdateServiceInput;

    const service = await prisma.service.update({
      where: { id: parseInt(id) },
      data,
    });

    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointmentsCount = await prisma.appointment.count({
      where: { serviceId: parseInt(id) },
    });

    if (appointmentsCount > 0) {
      await prisma.service.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
      });
      return res.json({ message: 'Услуга деактивирована' });
    }

    await prisma.service.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Услуга удалена' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
