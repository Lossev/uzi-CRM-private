import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface ReportData {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  appointmentsCount: number;
  averageCheck: number;
  revenueByService: { name: string; revenue: number }[];
  revenueByStaff: { name: string; revenue: number }[];
  chartData: { date: string; revenue: number }[];
}

export interface ReportSettings {
  includeTotalRevenue?: boolean;
  includeAppointmentsCount?: boolean;
  includeAverageCheck?: boolean;
  includeRevenueByService?: boolean;
  includeRevenueByStaff?: boolean;
  includeDailyRevenue?: boolean;
}

const getEmailConfig = (): EmailConfig => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
});

const createTransporter = () => {
  const config = getEmailConfig();
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const generateReportHTML = (data: ReportData, settings?: ReportSettings): string => {
  const { startDate, endDate, totalRevenue, appointmentsCount, averageCheck, revenueByService, revenueByStaff, chartData } = data;
  
  const formatDate = (date: Date) => format(date, 'd MMMM yyyy', { locale: ru });
  
  const topServices = revenueByService.slice(0, 5);
  const topStaff = revenueByStaff.slice(0, 5);
  const recentDays = chartData.slice(-7).reverse();
  
  const showTotalRevenue = settings?.includeTotalRevenue !== false;
  const showAppointmentsCount = settings?.includeAppointmentsCount !== false;
  const showAverageCheck = settings?.includeAverageCheck !== false;
  const showRevenueByService = settings?.includeRevenueByService !== false;
  const showRevenueByStaff = settings?.includeRevenueByStaff !== false;
  const showDailyRevenue = settings?.includeDailyRevenue !== false;
  
  const showAnyStats = showTotalRevenue || showAppointmentsCount || showAverageCheck;
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Отчет по выручке</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Отчет по выручке</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${formatDate(startDate)} — ${formatDate(endDate)}
              </p>
            </td>
          </tr>
          
          ${showAnyStats ? `
          <tr>
            <td style="padding: 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${showTotalRevenue ? `
                  <td width="${showAnyStats ? 100 / [showTotalRevenue, showAppointmentsCount, showAverageCheck].filter(Boolean).length : 33.33}%" style="padding: 0 8px;">
                    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Общая выручка</p>
                      <p style="margin: 0; color: #059669; font-size: 22px; font-weight: 700;">${formatPrice(totalRevenue)}</p>
                    </div>
                  </td>
                  ` : ''}
                  ${showAppointmentsCount ? `
                  <td width="${showAnyStats ? 100 / [showTotalRevenue, showAppointmentsCount, showAverageCheck].filter(Boolean).length : 33.33}%" style="padding: 0 8px;">
                    <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Приёмов</p>
                      <p style="margin: 0; color: #2563eb; font-size: 22px; font-weight: 700;">${appointmentsCount}</p>
                    </div>
                  </td>
                  ` : ''}
                  ${showAverageCheck ? `
                  <td width="${showAnyStats ? 100 / [showTotalRevenue, showAppointmentsCount, showAverageCheck].filter(Boolean).length : 33.33}%" style="padding: 0 8px;">
                    <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Средний чек</p>
                      <p style="margin: 0; color: #d97706; font-size: 22px; font-weight: 700;">${formatPrice(averageCheck)}</p>
                    </div>
                  </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          ${showRevenueByService && topServices.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">Топ услуг по выручке</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase;">Услуга</th>
                    <th style="padding: 12px 16px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase;">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  ${topServices.map((service, index) => `
                    <tr style="border-top: 1px solid #e5e7eb;${index % 2 === 0 ? '' : ' background-color: #f9fafb;'}">
                      <td style="padding: 12px 16px; color: #374151; font-size: 14px;">${service.name}</td>
                      <td style="padding: 12px 16px; text-align: right; color: #059669; font-size: 14px; font-weight: 600;">${formatPrice(service.revenue)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}
          
          ${showRevenueByStaff && topStaff.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">Выручка по сотрудникам</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase;">Сотрудник</th>
                    <th style="padding: 12px 16px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase;">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  ${topStaff.map((staff, index) => `
                    <tr style="border-top: 1px solid #e5e7eb;${index % 2 === 0 ? '' : ' background-color: #f9fafb;'}">
                      <td style="padding: 12px 16px; color: #374151; font-size: 14px;">${staff.name}</td>
                      <td style="padding: 12px 16px; text-align: right; color: #059669; font-size: 14px; font-weight: 600;">${formatPrice(staff.revenue)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}
          
          ${showDailyRevenue && recentDays.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">Выручка за последние дни</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase;">Дата</th>
                    <th style="padding: 12px 16px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase;">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentDays.map((day, index) => `
                    <tr style="border-top: 1px solid #e5e7eb;${index % 2 === 0 ? '' : ' background-color: #f9fafb;'}">
                      <td style="padding: 12px 16px; color: #374151; font-size: 14px;">${format(new Date(day.date), 'd MMMM', { locale: ru })}</td>
                      <td style="padding: 12px 16px; text-align: right; color: #059669; font-size: 14px; font-weight: 600;">${formatPrice(day.revenue)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Отчет сгенерирован автоматически • УЗИ Диагностика
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

const generateReportText = (data: ReportData, settings?: ReportSettings): string => {
  const { startDate, endDate, totalRevenue, appointmentsCount, averageCheck, revenueByService, revenueByStaff } = data;
  
  const formatDate = (date: Date) => format(date, 'd MMMM yyyy', { locale: ru });
  
  const showTotalRevenue = settings?.includeTotalRevenue !== false;
  const showAppointmentsCount = settings?.includeAppointmentsCount !== false;
  const showAverageCheck = settings?.includeAverageCheck !== false;
  const showRevenueByService = settings?.includeRevenueByService !== false;
  const showRevenueByStaff = settings?.includeRevenueByStaff !== false;
  
  let text = `ОТЧЕТ ПО ВЫРУЧКЕ\n${formatDate(startDate)} — ${formatDate(endDate)}\n\n`;
  
  if (showTotalRevenue || showAppointmentsCount || showAverageCheck) {
    text += `ОБЩИЕ ПОКАЗАТЕЛИ:\n`;
    if (showTotalRevenue) text += `Общая выручка: ${formatPrice(totalRevenue)}\n`;
    if (showAppointmentsCount) text += `Количество приёмов: ${appointmentsCount}\n`;
    if (showAverageCheck) text += `Средний чек: ${formatPrice(averageCheck)}\n`;
    text += '\n';
  }
  
  if (showRevenueByService && revenueByService.length > 0) {
    text += `ВЫРУЧКА ПО УСЛУГАМ:\n`;
    revenueByService.slice(0, 5).forEach((s, i) => {
      text += `${i + 1}. ${s.name}: ${formatPrice(s.revenue)}\n`;
    });
    text += '\n';
  }
  
  if (showRevenueByStaff && revenueByStaff.length > 0) {
    text += `ВЫРУЧКА ПО СОТРУДНИКАМ:\n`;
    revenueByStaff.slice(0, 5).forEach((s, i) => {
      text += `${i + 1}. ${s.name}: ${formatPrice(s.revenue)}\n`;
    });
  }
  
  return text;
};

export const sendReportEmail = async (
  to: string,
  data: ReportData,
  settings?: ReportSettings
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const config = getEmailConfig();
    
    if (!config.user || !config.pass) {
      return { 
        success: false, 
        error: 'SMTP не настроен. Проверьте переменные окружения SMTP_USER и SMTP_PASS.' 
      };
    }
    
    const transporter = createTransporter();
    
    await transporter.verify();
    
    const html = generateReportHTML(data, settings);
    const text = generateReportText(data, settings);
    
    const info = await transporter.sendMail({
      from: `"УЗИ Диагностика" <${config.from}>`,
      to,
      subject: `Отчет по выручке (${format(data.startDate, 'd.MM.yyyy')} - ${format(data.endDate, 'd.MM.yyyy')})`,
      text,
      html,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Send email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки email';
    return { success: false, error: errorMessage };
  }
};

export const testEmailConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const config = getEmailConfig();
    
    if (!config.user || !config.pass) {
      return { 
        success: false, 
        error: 'SMTP не настроен' 
      };
    }
    
    const transporter = createTransporter();
    await transporter.verify();
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка подключения';
    return { success: false, error: errorMessage };
  }
};

export const testEmailConnectionWithConfig = async (config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!config.user || !config.pass) {
      return { 
        success: false, 
        error: 'SMTP не настроен' 
      };
    }
    
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    
    await transporter.verify();
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка подключения';
    return { success: false, error: errorMessage };
  }
};
