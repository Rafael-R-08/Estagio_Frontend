import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProtectedRoute } from './app/ProtectedRoute';
import { AppLayout } from './layout/AppLayout';
import { Toaster } from 'sonner';

import { applyTheme } from "./utils/theme";

const savedTheme = (localStorage.getItem("lh_theme") as never) || "system";
applyTheme(savedTheme);

// Pages — Auth
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';

// Pages — App
import DashboardPage from './features/dashboard/pages/DashboardPage';
import SearchPage from './features/search/pages/SearchPage';
import CourseDetailPage from './features/search/pages/CourseDetailPage';
import MyLearningPage from './features/my-learning/pages/MyLearningPage';
import CertificatesPage from './features/certificates/pages/CertificatesPage';
import AiAssistantPage from './features/ai-assistant/pages/AiAssistantPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import SettingsPage from './features/settings/pages/SettingsPage';
import AdminPage from './features/admin/pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — layout comum */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/course/:id" element={<CourseDetailPage />} />
              <Route path="/my-learning" element={<MyLearningPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/ai" element={<AiAssistantPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          {/* Redirect raiz */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
      <Toaster position="bottom-right" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
