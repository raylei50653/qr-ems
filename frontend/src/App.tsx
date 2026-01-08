import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { EquipmentDetailPage } from './pages/Equipment/EquipmentDetailPage';
import { ScanPage } from './pages/Scan/ScanPage';
import { ScanRedirectPage } from './pages/Scan/ScanRedirectPage';
import { BorrowPage } from './pages/Borrow/BorrowPage';
import { UserManagement } from './pages/Admin/UserManagement';
import { ReturnRequests } from './pages/Admin/ReturnRequests';
import { EquipmentManagement } from './pages/Admin/EquipmentManagement';
import { EquipmentDeleteConfirmPage } from './pages/Admin/EquipmentDeleteConfirmPage';
import { EquipmentRemovalPage } from './pages/Admin/EquipmentRemovalPage';
import { CategoryManagement } from './pages/Admin/CategoryManagement';
import { LocationManagement } from './pages/Admin/Locations/LocationManagement';
import { LocationConfirmPage } from './pages/Admin/Locations/LocationConfirmPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient();

// Read from .env. The `VITE_` prefix is necessary for Vite to expose env vars to client-side code.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const PrivateRoute = () => {
  const token = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              
              {/* Equipment Routes */}
              <Route path="/equipment/:uuid" element={<EquipmentDetailPage />} />
              <Route path="/borrow/:uuid" element={<BorrowPage />} />
              
              {/* Scan Routes */}
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/scan/:uuid" element={<ScanRedirectPage />} />

              {/* Admin Routes */}
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/returns" element={<ReturnRequests />} />
              <Route path="/admin/equipment" element={<EquipmentManagement />} />
              <Route path="/admin/equipment/delete/:uuid" element={<EquipmentDeleteConfirmPage />} />
              <Route path="/admin/equipment/removal" element={<EquipmentRemovalPage />} />
              <Route path="/admin/categories" element={<CategoryManagement />} />
              <Route path="/admin/locations" element={<LocationManagement />} />
              <Route path="/admin/locations/confirm" element={<LocationConfirmPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;