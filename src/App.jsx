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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Always show public routes without waiting for auth
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Landing" replace />} />
      <Route path="/Landing" element={<Landing />} />
      <Route path="*" element={
        <ProtectedRoutes
          isLoading={isLoadingPublicSettings || isLoadingAuth}
          authError={authError}
          navigateToLogin={navigateToLogin}
        />
      } />
    </Routes>
  );
};

const ProtectedRoutes = ({ isLoading, authError, navigateToLogin }) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/BrowseApps" element={<BrowseApps />} />
        <Route path="/UploadApp" element={<UploadApp />} />
        <Route path="/AppDetail" element={<AppDetail />} />
        <Route path="/Verification" element={<Verification />} />
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