import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, CreateClientInput, UpdateClientInput } from '../types';

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: { select: { appointments: true } },
          appointments: {
            take: 5,
            orderBy: { date: 'desc' },
            include: { service: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      clients,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          include: {
            service: true,
            staff: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    const totalSpent = await prisma.appointment.aggregate({
      where: {
        clientId: client.id,
        status: 'COMPLETED',
        price: { not: null },
      },
      _sum: { price: true },
    });

    res.json({
      ...client,
      totalSpent: totalSpent._sum.price || 0,
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as CreateClientInput;

    const existingClient = await prisma.client.findUnique({
      where: { phone: data.phone },
    });

    if (existingClient) {
      return res.status(400).json({ error: 'Клиент с таким телефоном уже существует' });
    }

    const client = await prisma.client.create({
      data,
    });

    await prisma.actionLog.create({
      data: {
        userId: req.userId!,
        action: 'CREATE',
        entityType: 'Client',
        entityId: client.id,
        details: JSON.stringify({ name: client.name, phone: client.phone }),
      },
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body as UpdateClientInput;

    if (data.phone) {
      const existingClient = await prisma.client.findFirst({
        where: {
          phone: data.phone,
          id: { not: parseInt(id) },
        },
      });

      if (existingClient) {
        return res.status(400).json({ error: 'Клиент с таким телефоном уже существует' });
      }
    }

    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data,
    });

    await prisma.actionLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE',
        entityType: 'Client',
        entityId: client.id,
        details: JSON.stringify({ changes: data }),
      },
    });

    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointmentsCount = await prisma.appointment.count({
      where: { clientId: parseInt(id) },
    });

    if (appointmentsCount > 0) {
      return res.status(400).json({ 
        error: 'Невозможно удалить клиента с историей записей' 
      });
    }

    await prisma.client.delete({
      where: { id: parseInt(id) },
    });

    await prisma.actionLog.create({
      data: {
        userId: req.userId!,
        action: 'DELETE',
        entityType: 'Client',
        entityId: parseInt(id),
      },
    });

    res.json({ message: 'Клиент удален' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
