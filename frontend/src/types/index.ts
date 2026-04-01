export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'ASSISTANT';
  createdAt?: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  appointments?: Appointment[];
  totalSpent?: number;
  _count?: { appointments: number };
}

export interface Service {
  id: number;
  name: string;
  description?: string | null;
  duration: number;
  price: number;
  isActive: boolean;
}

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: number;
  clientId: number;
  serviceId: number;
  staffId: number;
  date: string;
  status: AppointmentStatus;
  price?: number | null;
  notes?: string | null;
  createdAt: string;
  client: Client;
  service: Service;
  staff: { id: number; name: string };
}

export interface ScheduleSettings {
  id: number;
  workStartTime: string;
  workEndTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  slotDuration: number;
  workDays: string;
}

export interface DashboardStats {
  today: { appointments: number; revenue: number };
  tomorrow: { appointments: number };
  week: { appointments: number; revenue: number };
  month: { appointments: number; revenue: number };
  pending: number;
  newClients: number;
  chartData: Array<{ day: string; count: number; revenue: number }>;
}

export interface RevenueStats {
  totalRevenue: number;
  appointmentsCount: number;
  revenueByService: Array<{ name: string; revenue: number }>;
  revenueByStaff: Array<{ name: string; revenue: number }>;
  chartData: Array<{ date: string; revenue: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

  
export interface EmailSettings {
  id: number
  enabled: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string | null
  smtpPass: string | null
  smtpFrom: string | null
  reportEmail: string | null
}
