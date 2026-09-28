import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './features/auth/LoginPage';
import { ActivateAccountPage } from './features/auth/ActivateAccountPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { QuotesListPage } from './features/quotes/QuotesListPage';
import { NewQuotePage } from './features/quotes/NewQuotePage';
import { WorkOrdersPage } from './features/work-orders/WorkOrdersPage';
import { RawMaterialsPage } from './features/raw-materials/RawMaterialsPage';
import { PartiesPage } from './features/parties/PartiesPage';
import { MachinesPage } from './features/machines/MachinesPage';
import { UsersPage } from './features/users/UsersPage';
import { EmployeesPage } from './features/employees/EmployeesPage';
import { OperatingExpensesPage } from './features/operating-expenses/OperatingExpensesPage';
import { ReceivablesPage } from './features/receivables/ReceivablesPage';
import { DrePage } from './features/financial/DrePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 min
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate" element={<ActivateAccountPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/quotes" element={<QuotesListPage />} />
              <Route path="/quotes/new" element={<NewQuotePage />} />
              <Route path="/work-orders" element={<WorkOrdersPage />} />
              <Route path="/raw-materials" element={<RawMaterialsPage />} />
              <Route path="/parties" element={<PartiesPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/receivables" element={<ReceivablesPage />} />
              <Route path="/expenses" element={<OperatingExpensesPage />} />
              <Route path="/financial/dre" element={<DrePage />} />
              <Route path="/machines" element={<MachinesPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
