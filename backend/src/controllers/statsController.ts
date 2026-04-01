import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../types';
import { sendReportEmail, ReportData, testEmailConnectionWithConfig } from '../utils/email';
import { sendTelegramReport, testTelegramConnection } from '../utils/telegram';

export const sendRevenueReport = async (req: AuthRequest, res: Response) => {
  try {
    const { email, startDate, endDate, telegramChatId, sendToTelegram, sendToEmail } = req.body;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    if (!startDate) start.setDate(start.getDate() - 30);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        date: { gte: start, lte: end },
        price: { not: null },
      },
      include: {
        service: true,
        staff: { select: { id: true, name: true } },
      },
    });

    const totalRevenue = appointments.reduce((sum, apt) => sum + Number(apt.price || 0), 0);
    const appointmentsCount = appointments.length;
    const averageCheck = appointmentsCount > 0 ? totalRevenue / appointmentsCount : 0;

    const revenueByService = appointments.reduce((acc, apt) => {
      const serviceName = apt.service.name;
      acc[serviceName] = (acc[serviceName] || 0) + Number(apt.price || 0);
      return acc;
    }, {} as Record<string, number>);

    const revenueByStaff = appointments.reduce((acc, apt) => {
      const staffName = apt.staff.name;
      acc[staffName] = (acc[staffName] || 0) + Number(apt.price || 0);
      return acc;
    }, {} as Record<string, number>);

    const dailyRevenue = appointments.reduce((acc, apt) => {
      const date = apt.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + Number(apt.price || 0);
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const reportData: ReportData = {
      startDate: start,
      endDate: end,
      totalRevenue,
      appointmentsCount,
      averageCheck,
      revenueByService: Object.entries(revenueByService)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      revenueByStaff: Object.entries(revenueByStaff)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      chartData,
    };

    const reportSettings = await prisma.reportSettings.findUnique({
      where: { id: 1 },
    });

    const reportConfig = reportSettings ? {
      includeTotalRevenue: reportSettings.includeTotalRevenue,
      includeAppointmentsCount: reportSettings.includeAppointmentsCount,
      includeAverageCheck: reportSettings.includeAverageCheck,
      includeRevenueByService: reportSettings.includeRevenueByService,
      includeRevenueByStaff: reportSettings.includeRevenueByStaff,
      includeDailyRevenue: reportSettings.includeDailyRevenue,
    } : undefined;

    const results: { email?: { success: boolean; error?: string }; telegram?: { success: boolean; error?: string } } = {};

    if (sendToEmail !== false && email) {
      results.email = await sendReportEmail(email, reportData, reportConfig);
    }

    if (sendToTelegram && telegramChatId) {
      const telegramSettings = await prisma.telegramSettings.findUnique({
        where: { id: 1 },
      });
      
      const proxyConfig = telegramSettings?.proxyEnabled ? {
        enabled: telegramSettings.proxyEnabled,
        host: telegramSettings.proxyHost || undefined,
        port: telegramSettings.proxyPort || undefined,
        username: telegramSettings.proxyUsername || undefined,
        password: telegramSettings.proxyPassword || undefined,
      } : undefined;
      
      if (telegramSettings?.botToken) {
        results.telegram = await sendTelegramReport(telegramChatId, reportData, telegramSettings.botToken, proxyConfig, reportConfig);
      } else {
        results.telegram = await sendTelegramReport(telegramChatId, reportData, undefined, proxyConfig, reportConfig);
      }
    }

    const hasErrors = Object.values(results).some(r => r && !r.success);
    if (hasErrors) {
      return res.status(400).json({ 
        error: 'Ошибка отправки отчета',
        results 
      });
    }

    const messages: string[] = [];
    if (results.email?.success) messages.push(`на ${email}`);
    if (results.telegram?.success) messages.push('в Telegram');

    res.json({ 
      success: true, 
      message: messages.length > 0 ? `Отчет отправлен ${messages.join(' и ')}` : 'Отчет сформирован',
      results 
    });
  } catch (error) {
    console.error('Send revenue report error:', error);
    res.status(500).json({ error: 'Ошибка отправки отчета' });
  }
};

export const getEmailSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.emailSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.emailSettings.create({
        data: { id: 1 },
      });
    }

    res.json({
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : null,
    });
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateEmailSettings = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const updateData: Record<string, unknown> = {
      enabled: data.enabled,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpSecure: data.smtpSecure,
      smtpUser: data.smtpUser || null,
      smtpFrom: data.smtpFrom || null,
      reportEmail: data.reportEmail || null,
    };

    if (data.smtpPass && data.smtpPass !== '••••••••') {
      updateData.smtpPass = data.smtpPass;
    }

    const settings = await prisma.emailSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData,
        smtpPass: data.smtpPass || null,
      },
    });

    res.json({
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : null,
    });
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const testEmailSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.emailSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings || !settings.smtpUser || !settings.smtpPass) {
      return res.status(400).json({ success: false, error: 'SMTP не настроен' });
    }

    const result = await testEmailConnectionWithConfig({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      user: settings.smtpUser,
      pass: settings.smtpPass,
    });

    res.json(result);
  } catch (error) {
    console.error('Test email settings error:', error);
    res.status(500).json({ success: false, error: 'Ошибка тестирования' });
  }
};

export const getRevenueStats = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);
    if (!startDate) start.setDate(start.getDate() - 30);

    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        date: { gte: start, lte: end },
        price: { not: null },
      },
      include: {
        service: true,
        staff: { select: { id: true, name: true } },
      },
    });

    const totalRevenue = appointments.reduce((sum, apt) => sum + Number(apt.price || 0), 0);

    const revenueByService = appointments.reduce((acc, apt) => {
      const serviceName = apt.service.name;
      acc[serviceName] = (acc[serviceName] || 0) + Number(apt.price || 0);
      return acc;
    }, {} as Record<string, number>);

    const revenueByStaff = appointments.reduce((acc, apt) => {
      const staffName = apt.staff.name;
      acc[staffName] = (acc[staffName] || 0) + Number(apt.price || 0);
      return acc;
    }, {} as Record<string, number>);

    const dailyRevenue = appointments.reduce((acc, apt) => {
      const date = apt.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + Number(apt.price || 0);
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalRevenue,
      appointmentsCount: appointments.length,
      revenueByService: Object.entries(revenueByService)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      revenueByStaff: Object.entries(revenueByStaff)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      chartData,
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('[Dashboard] Today:', today.toISOString());
    console.log('[Dashboard] Tomorrow:', tomorrow.toISOString());

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const [
      todayAppointments,
      tomorrowAppointments,
      weekAppointments,
      monthAppointments,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      pendingAppointments,
      recentClients,
    ] = await Promise.all([
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
      prisma.appointment.count({
        where: {
          date: { gte: today, lt: weekEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.appointment.count({
        where: {
          date: { gte: today, lt: monthEnd },
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
      prisma.appointment.aggregate({
        where: {
          status: 'COMPLETED',
          date: { gte: today, lt: weekEnd },
          price: { not: null },
        },
        _sum: { price: true },
      }),
      prisma.appointment.aggregate({
        where: {
          status: 'COMPLETED',
          date: { gte: today, lt: monthEnd },
          price: { not: null },
        },
        _sum: { price: true },
      }),
      prisma.appointment.count({
        where: {
          status: 'SCHEDULED',
          date: { gte: today },
        },
      }),
      prisma.client.count({
        where: {
          createdAt: { gte: new Date(today.getTime() - 7 * 86400000) },
        },
      }),
    ]);

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const dailyStats = await prisma.$queryRaw`
      SELECT 
        date::date as day,
        COUNT(*)::int as count,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN price ELSE NULL END), 0)::float as revenue
      FROM "Appointment"
      WHERE date >= ${last30Days} AND date < ${tomorrow}
      GROUP BY date::date
      ORDER BY day ASC
    `;

    const result = {
      today: {
        appointments: todayAppointments,
        revenue: Number(todayRevenue._sum.price || 0),
      },
      tomorrow: {
        appointments: tomorrowAppointments,
      },
      week: {
        appointments: weekAppointments,
        revenue: Number(weekRevenue._sum.price || 0),
      },
      month: {
        appointments: monthAppointments,
        revenue: Number(monthRevenue._sum.price || 0),
      },
      pending: pendingAppointments,
      newClients: recentClients,
      chartData: dailyStats,
    };
    console.log('[Dashboard] Result today:', result.today.appointments, 'pending:', result.pending);
    res.json(result);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getScheduleSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.scheduleSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      return res.status(404).json({ error: 'Настройки не найдены' });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get schedule settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateScheduleSettings = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const settings = await prisma.scheduleSettings.update({
      where: { id: 1 },
      data,
    });

    res.json(settings);
  } catch (error) {
    console.error('Update schedule settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getTelegramSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.telegramSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.telegramSettings.create({
        data: { id: 1 },
      });
    }

    res.json({
      ...settings,
      botToken: settings.botToken ? '••••••••••••••••' : null,
      proxyPassword: settings.proxyPassword ? '••••••••••' : null,
    });
  } catch (error) {
    console.error('Get telegram settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateTelegramSettings = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const updateData: Record<string, unknown> = {
      enabled: data.enabled,
      defaultChatId: data.defaultChatId || null,
      proxyEnabled: data.proxyEnabled || false,
      proxyHost: data.proxyHost || null,
      proxyPort: data.proxyPort || null,
      proxyUsername: data.proxyUsername || null,
    };

    if (data.botToken && data.botToken !== '••••••••••••••••') {
      updateData.botToken = data.botToken;
    }

    if (data.proxyPassword && data.proxyPassword !== '••••••••••') {
      updateData.proxyPassword = data.proxyPassword;
    }

    const settings = await prisma.telegramSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData,
        botToken: data.botToken || null,
        proxyPassword: data.proxyPassword || null,
      },
    });

    res.json({
      ...settings,
      botToken: settings.botToken ? '••••••••••••••••' : null,
      proxyPassword: settings.proxyPassword ? '••••••••••' : null,
    });
  } catch (error) {
    console.error('Update telegram settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const testTelegramSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.telegramSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings || !settings.botToken) {
      return res.status(400).json({ success: false, error: 'Telegram Bot Token не настроен' });
    }

    const proxyConfig = settings.proxyEnabled ? {
      enabled: settings.proxyEnabled,
      host: settings.proxyHost || undefined,
      port: settings.proxyPort || undefined,
      username: settings.proxyUsername || undefined,
      password: settings.proxyPassword || undefined,
    } : undefined;

    const result = await testTelegramConnection(settings.botToken, proxyConfig);

    if (result.success) {
      res.json({ success: true, botInfo: result.chatInfo });
    } else {
      res.json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Test telegram settings error:', error);
    res.status(500).json({ success: false, error: 'Ошибка тестирования' });
  }
};

export const getReportSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.reportSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.reportSettings.create({
        data: { id: 1 },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get report settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const updateReportSettings = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const settings = await prisma.reportSettings.upsert({
      where: { id: 1 },
      update: {
        includeTotalRevenue: data.includeTotalRevenue,
        includeAppointmentsCount: data.includeAppointmentsCount,
        includeAverageCheck: data.includeAverageCheck,
        includeRevenueByService: data.includeRevenueByService,
        includeRevenueByStaff: data.includeRevenueByStaff,
        includeDailyRevenue: data.includeDailyRevenue,
      },
      create: {
        id: 1,
        includeTotalRevenue: data.includeTotalRevenue,
        includeAppointmentsCount: data.includeAppointmentsCount,
        includeAverageCheck: data.includeAverageCheck,
        includeRevenueByService: data.includeRevenueByService,
        includeRevenueByStaff: data.includeRevenueByStaff,
        includeDailyRevenue: data.includeDailyRevenue,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('Update report settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
