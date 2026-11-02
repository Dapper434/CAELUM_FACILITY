import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
