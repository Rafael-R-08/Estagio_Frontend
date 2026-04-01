import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProtectedRoute } from './app/ProtectedRoute';
import { AppLayout } from './layout/AppLayout';
import { Toaster } from 'sonner';

import { applyTheme } from "./utils/theme";

const savedTheme = (localStorage.getItem("lh_theme") as never) || "system";
applyTheme(savedTheme);

// Pages — Auth
const LandingPage = lazy(() => import('./features/landing/pages/LandingPage'));
// LoginPage can be removed if fully unified, but keeping it for now if needed as a chunk
// const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));

// Pages — App
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));
const SearchPage = lazy(() => import('./features/search/pages/SearchPage'));
const CourseDetailPage = lazy(() => import('./features/search/pages/CourseDetailPage'));
const MyLearningPage = lazy(() => import('./features/my-learning/pages/MyLearningPage'));
const CertificatesPage = lazy(() => import('./features/certificates/pages/CertificatesPage'));
const AiAssistantPage = lazy(() => import('./features/ai-assistant/pages/AiAssistantPage'));
const ProfilePage = lazy(() => import('./features/profile/pages/ProfilePage'));
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage'));
const AdminPage = lazy(() => import('./features/admin/pages/AdminPage'));
const SlManagerPage = lazy(() => import('./features/sl-manager/pages/SlManagerPage'));
const SlManagerUserDetailPage = lazy(() => import('./features/sl-manager/pages/SlManagerUserDetailPage'));

import { InstallPrompt } from './components/ui/InstallPrompt';
import { ErrorBoundary } from './app/ErrorBoundary';

function LoadingPlaceholder() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background/50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingPlaceholder />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LandingPage />} />


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

              {/* SL Manager only */}
              <Route element={<ProtectedRoute requiredRole="SERVICE_LINE_MANAGER" />}>
                <Route element={<AppLayout />}>
                  <Route path="/sl-manager" element={<SlManagerPage />} />
                  <Route path="/sl-manager/users/:id" element={<SlManagerUserDetailPage />} />
                </Route>
              </Route>

              {/* Redirect 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
        <InstallPrompt />
        <Toaster position="bottom-right" richColors closeButton />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
