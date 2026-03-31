import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface TelegramResponse<T = any> {
  ok: boolean;
  result?: T;
  description?: string;
}

interface ReportData {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  appointmentsCount: number;
  averageCheck: number;
  revenueByService: { name: string; revenue: number }[];
  revenueByStaff: { name: string; revenue: number }[];
  chartData: { date: string; revenue: number }[];
}

const getTelegramConfig = (): TelegramConfig => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
});

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const escapeMarkdown = (text: string): string => {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
};

const generateTelegramReport = (data: ReportData): string => {
  const { startDate, endDate, totalRevenue, appointmentsCount, averageCheck, revenueByService, revenueByStaff, chartData } = data;
  
  const formatDate = (date: Date) => format(date, 'd MMMM yyyy', { locale: ru });
  const formatDateShort = (date: Date) => format(date, 'd.MM');
  
  const topServices = revenueByService.slice(0, 5);
  const topStaff = revenueByStaff.slice(0, 5);
  const recentDays = chartData.slice(-7).reverse();
  
  let message = `📊 *Отчет по выручке*\n`;
  message += `📅 ${escapeMarkdown(formatDate(startDate))} — ${escapeMarkdown(formatDate(endDate))}\n\n`;
  
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *Общая выручка:* ${formatPrice(totalRevenue)}\n`;
  message += `📋 *Приёмов:* ${appointmentsCount}\n`;
  message += `💵 *Средний чек:* ${formatPrice(averageCheck)}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (topServices.length > 0) {
    message += `🏆 *Топ услуг по выручке:*\n`;
    topServices.forEach((service, index) => {
      message += `${index + 1}\\. ${escapeMarkdown(service.name)}: ${formatPrice(service.revenue)}\n`;
    });
    message += '\n';
  }
  
  if (topStaff.length > 0) {
    message += `👥 *Выручка по сотрудникам:*\n`;
    topStaff.forEach((staff, index) => {
      message += `${index + 1}\\. ${escapeMarkdown(staff.name)}: ${formatPrice(staff.revenue)}\n`;
    });
    message += '\n';
  }
  
  if (recentDays.length > 0) {
    message += `📈 *Последние дни:*\n`;
    recentDays.slice(0, 5).forEach((day) => {
      message += `• ${formatDateShort(new Date(day.date))}: ${formatPrice(day.revenue)}\n`;
    });
  }
  
  message += '\n_Сгенерировано автоматически_';
  
  return message;
};

export const sendTelegramReport = async (
  chatId: string,
  data: ReportData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const config = getTelegramConfig();
    
    if (!config.botToken) {
      return { 
        success: false, 
        error: 'Telegram Bot Token не настроен. Проверьте переменную окружения TELEGRAM_BOT_TOKEN.' 
      };
    }
    
    const targetChatId = chatId || config.chatId;
    
    if (!targetChatId) {
      return {
        success: false,
        error: 'Telegram Chat ID не указан.',
      };
    }
    
    const message = generateTelegramReport(data);
    
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
    });
    
    const result = await response.json() as TelegramResponse;
    
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return {
        success: false,
        error: result.description || 'Ошибка отправки в Telegram',
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Send Telegram error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки в Telegram';
    return { success: false, error: errorMessage };
  }
};

export const testTelegramConnection = async (): Promise<{ success: boolean; error?: string; chatInfo?: any }> => {
  try {
    const config = getTelegramConfig();
    
    if (!config.botToken) {
      return { 
        success: false, 
        error: 'Telegram Bot Token не настроен' 
      };
    }
    
    const url = `https://api.telegram.org/bot${config.botToken}/getMe`;
    
    const response = await fetch(url);
    const result = await response.json() as TelegramResponse;
    
    if (!result.ok) {
      return {
        success: false,
      error: result.description || 'Неверный Bot Token',
    };
    }
    
    return { 
      success: true,
      chatInfo: result.result 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка подключения';
    return { success: false, error: errorMessage };
  }
};

export const getTelegramChatInfo = async (): Promise<{ success: boolean; error?: string; chatInfo?: any }> => {
  try {
    const config = getTelegramConfig();
    
    if (!config.botToken) {
      return { 
        success: false, 
        error: 'Telegram Bot Token не настроен' 
      };
    }
    
    const url = `https://api.telegram.org/bot${config.botToken}/getUpdates`;
    
    const response = await fetch(url);
    const result = await response.json() as TelegramResponse;
    
    if (!result.ok) {
      return {
        success: false,
      error: result.description || 'Ошибка получения информации',
    };
    }
    
    return { 
      success: true,
      chatInfo: result.result 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка';
    return { success: false, error: errorMessage };
  }
};
