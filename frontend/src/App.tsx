import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/toaster'
import api from '@/lib/api'

import Layout from '@/components/Layout'
import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import CalendarPage from '@/pages/admin/CalendarPage'
import RecurringPage from '@/pages/admin/RecurringPage'
import WaitlistPage from '@/pages/admin/WaitlistPage'
import AppointmentsPage from '@/pages/admin/AppointmentsPage'
import ClientsPage from '@/pages/admin/ClientsPage'
import RevenuePage from '@/pages/admin/RevenuePage'
import ServicesPage from '@/pages/admin/ServicesPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import BookingPage from '@/pages/public/BookingPage'
import ReportsPage from '@/pages/admin/ReportsPage'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

function App() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      api.get('/auth/me').then(res => {
        setUser(res.data)
      }).catch(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }).finally(() => {
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [setUser, setLoading])

  return (
    <>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="waitlist" element={<WaitlistPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route
            path="settings"
            element={
              <ProtectedRoute adminOnly>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
