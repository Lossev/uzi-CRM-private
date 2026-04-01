import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface ProxyConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
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

interface ReportSettings {
  includeTotalRevenue?: boolean;
  includeAppointmentsCount?: boolean;
  includeAverageCheck?: boolean;
  includeRevenueByService?: boolean;
  includeRevenueByStaff?: boolean;
  includeDailyRevenue?: boolean;
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

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const generateTelegramReport = (data: ReportData, settings?: ReportSettings): string => {
  const { startDate, endDate, totalRevenue, appointmentsCount, averageCheck, revenueByService, revenueByStaff, chartData } = data;
  
  const formatDate = (date: Date) => format(date, 'd MMMM yyyy', { locale: ru });
  const formatDateShort = (date: Date) => format(date, 'd.MM');
  
  const topServices = revenueByService.slice(0, 5);
  const topStaff = revenueByStaff.slice(0, 5);
  const recentDays = chartData.slice(-7).reverse();
  
  const showTotalRevenue = settings?.includeTotalRevenue !== false;
  const showAppointmentsCount = settings?.includeAppointmentsCount !== false;
  const showAverageCheck = settings?.includeAverageCheck !== false;
  const showRevenueByService = settings?.includeRevenueByService !== false;
  const showRevenueByStaff = settings?.includeRevenueByStaff !== false;
  const showDailyRevenue = settings?.includeDailyRevenue !== false;
  
  let message = `<b>ОТЧЕТ ПО ВЫРУЧКЕ</b>\n`;
  message += `<i>${escapeHtml(formatDate(startDate))} — ${escapeHtml(formatDate(endDate))}</i>\n\n`;
  
  if (showTotalRevenue || showAppointmentsCount || showAverageCheck) {
    if (showTotalRevenue) message += `<b>Общая выручка:</b> ${formatPrice(totalRevenue)}\n`;
    if (showAppointmentsCount) message += `<b>Количество приёмов:</b> ${appointmentsCount}\n`;
    if (showAverageCheck) message += `<b>Средний чек:</b> ${formatPrice(averageCheck)}\n`;
    message += `\n`;
  }
  
  if (showRevenueByService && topServices.length > 0) {
    message += `<b>ТОП УСЛУГ:</b>\n`;
    topServices.forEach((service, index) => {
      message += `${index + 1}. ${escapeHtml(service.name)} — ${formatPrice(service.revenue)}\n`;
    });
    message += `\n`;
  }
  
  if (showRevenueByStaff && topStaff.length > 0) {
    message += `<b>ВЫРУЧКА ПО СОТРУДНИКАМ:</b>\n`;
    topStaff.forEach((staff, index) => {
      message += `${index + 1}. ${escapeHtml(staff.name)} — ${formatPrice(staff.revenue)}\n`;
    });
    message += `\n`;
  }
  
  if (showDailyRevenue && recentDays.length > 0) {
    message += `<b>ПОСЛЕДНИЕ ДНИ:</b>\n`;
    recentDays.slice(0, 5).forEach((day) => {
      message += `${formatDateShort(new Date(day.date))} — ${formatPrice(day.revenue)}\n`;
    });
  }
  
  return message;
};

const createProxyAgent = async (proxy: ProxyConfig): Promise<any> => {
  if (!proxy.enabled || !proxy.host || !proxy.port) {
    return undefined;
  }

  try {
    const { SocksProxyAgent } = await import('socks-proxy-agent');
    const auth = proxy.username && proxy.password 
      ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@` 
      : '';
    
    const proxyUrl = `socks5://${auth}${proxy.host}:${proxy.port}`;
    return new SocksProxyAgent(proxyUrl);
  } catch {
    console.warn('socks-proxy-agent not available');
    return undefined;
  }
};

export const sendTelegramReport = async (
  chatId: string,
  data: ReportData,
  botToken?: string,
  proxy?: ProxyConfig,
  settings?: ReportSettings
): Promise<{ success: boolean; error?: string }> => {
  try {
    const config = getTelegramConfig();
    
    const token = botToken || config.botToken;
    
    if (!token) {
      return { 
        success: false, 
        error: 'Telegram Bot Token не настроен.' 
      };
    }
    
    const targetChatId = chatId || config.chatId;
    
    if (!targetChatId) {
      return {
        success: false,
        error: 'Telegram Chat ID не указан.',
      };
    }
    
    const message = generateTelegramReport(data, settings);
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    const fetchOptions: RequestInit & { agent?: any } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    };

    if (proxy) {
      const agent = await createProxyAgent(proxy);
      if (agent) {
        fetchOptions.agent = agent;
      }
    }
    
    const response = await fetch(url, fetchOptions);
    
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

export const testTelegramConnection = async (
  botToken?: string,
  proxy?: ProxyConfig
): Promise<{ success: boolean; error?: string; chatInfo?: any }> => {
  try {
    const config = getTelegramConfig();
    
    const token = botToken || config.botToken;
    
    if (!token) {
      return { 
        success: false, 
        error: 'Telegram Bot Token не настроен' 
      };
    }
    
    const url = `https://api.telegram.org/bot${token}/getMe`;
    
    const fetchOptions: RequestInit & { agent?: any } = {};
    
    if (proxy) {
      const agent = await createProxyAgent(proxy);
      if (agent) {
        fetchOptions.agent = agent;
      }
    }
    
    const response = await fetch(url, fetchOptions);
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

export const getTelegramChatInfo = async (botToken?: string): Promise<{ success: boolean; error?: string; chatInfo?: any }> => {
  try {
    const config = getTelegramConfig();
    
    const token = botToken || config.botToken;
    
    if (!token) {
      return { 
        success: false, 
        error: 'Telegram Bot Token не настроен' 
      };
    }
    
    const url = `https://api.telegram.org/bot${token}/getUpdates`;
    
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
