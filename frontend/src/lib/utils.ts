import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '0 ₸';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
  }).format(Number(price));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '')
  
  if (digits.startsWith('7') || digits.startsWith('8')) {
    digits = digits.slice(1)
  }
  
  digits = digits.slice(0, 10)
  
  if (digits.length === 0) return ''
  
  let formatted = '+7'
  
  if (digits.length > 0) {
    formatted += ' (' + digits.slice(0, 3)
  }
  if (digits.length >= 3) {
    formatted += ') ' + digits.slice(3, 6)
  }
  if (digits.length >= 6) {
    formatted += '-' + digits.slice(6, 8)
  }
  if (digits.length >= 8) {
    formatted += '-' + digits.slice(8, 10)
  }
  
  return formatted
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return true
  }
  return digits.length === 10
}

export function capitalizeFirst(value: string): string {
  if (value.length === 0) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}
