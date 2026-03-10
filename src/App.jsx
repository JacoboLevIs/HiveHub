import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import BrowseApps from './pages/BrowseApps';
import UploadApp from './pages/UploadApp';
import AppDetail from './pages/AppDetail';
import Verification from './pages/Verification';
import DevMode from './pages/DevMode';
import HistoryPage from './pages/History';
import Notifications from './pages/Notifications';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, navigateToLogin } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Landing" replace />} />
      <Route path="/Landing" element={<Landing />} />
      <Route path="*" element={
        <ProtectedRoutes
          isLoading={isLoadingAuth}
          isAuthenticated={isAuthenticated}
          navigateToLogin={navigateToLogin}
        />
      } />
    </Routes>
  );
};

const ProtectedRoutes = ({ isLoading, isAuthenticated, navigateToLogin }) => {
  const publicPaths = ['/', '/Landing'];
  const currentPath = window.location.pathname;

  if (publicPaths.includes(currentPath)) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigateToLogin();
    return null;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/BrowseApps" element={<BrowseApps />} />
        <Route path="/UploadApp" element={<UploadApp />} />
        <Route path="/app/:id" element={<AppDetail />} />
        <Route path="/verify/:appId" element={<Verification />} />
        <Route path="/Verification" element={<Verification />} />
        <Route path="/History" element={<HistoryPage />} />
        <Route path="/Notifications" element={<Notifications />} />
        <Route path="/DevMode" element={<DevMode />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
