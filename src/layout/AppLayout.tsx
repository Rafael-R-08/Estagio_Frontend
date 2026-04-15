import { Outlet } from 'react-router-dom';
import { FloatingDock } from './FloatingDock';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { ProductTour } from '../features/onboarding/components/ProductTour';
import { useAuth } from '../features/auth/hooks/useAuth';

export function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans antialiased relative selection:bg-blue-500 selection:text-white">
      {/* Product Tour Overlay (Auto-triggered for new users) */}
      {user?.onboardingDone && <ProductTour />}

      {/* Modern Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 pb-safe-24 lg:pb-32 w-full">
        <Header />
        <main className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating Desktop Dock */}
      <FloatingDock />

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
