import React from 'react';
import { Route, Routes } from 'react-router';
import { WakeHint } from './components/ui';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import AvailabilityPage from './pages/AvailabilityPage';
import ForecastPage from './pages/ForecastPage';
import RequestsPage from './pages/RequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import OffersPage from './pages/OffersPage';
import TransfersPage from './pages/TransfersPage';
import TransferDetailPage from './pages/TransferDetailPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  return (
    <>
    <WakeHint />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Public: invite and recovery links land here with or without a session. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="availability" element={<AvailabilityPage />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="transfers/:id" element={<TransferDetailPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </>
  );
}
