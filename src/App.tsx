import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { PlanStatusBanner } from '@/components/PlanStatusBanner';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import AddRoom from '@/pages/AddRoom';
import Discover from '@/pages/Discover';
import RoomDetail from '@/pages/RoomDetail';
import LandlordDashboard from '@/pages/LandlordDashboard';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import { RentReceipt } from '@/components/RentReceipt';
import MoveInReport from '@/pages/MoveInReport';
import DamagesCalculator from '@/pages/DamagesCalculator';
import { RentBuddy } from '@/components/RentBuddy';

import Pricing from '@/pages/Pricing';
import Notifications from '@/pages/Notifications';
import TenantCV from '@/pages/TenantCV';
import DepositVault from '@/pages/DepositVault';


const queryClient = new QueryClient();

/**
 * Public Layout wrapper.
 * Includes the top navbar and footer (if any).
 */
const PublicLayout = () => (
  <div className="min-h-screen bg-surface flex flex-col">
    <Header />
    <PlanStatusBanner />
    <main className="flex-1">
      <Outlet />
    </main>
    <RentBuddy />
  </div>
);

/**
 * The main application component.
 * WHAT IT DOES: Sets up the global providers (React Query, Routing, Auth) and defines the core navigation structure of the app.
 * ANALOGY: The central station or lobby of a building that directs visitors to different floors or departments.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* 
              LANDLORD ROUTES (Sidebar Layout)
              These routes use a left sidebar which signifies a SaaS "product" experience.
              A sidebar implies a permanent workspace where the user manages assets.
            */}
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<LandlordDashboard />} />
              <Route path="/add-room" element={<AddRoom />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/agreements" element={<Settings />} />
              <Route path="/settings/billing" element={<Pricing />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/deposit-vault" element={<DepositVault />} />
            </Route>

            {/* 
              PUBLIC / TENANT ROUTES (Top Navbar Layout)
              These routes use a traditional top navbar which signifies a "website" or "marketplace".
              A navbar implies a visit where the user searches for content and then moves on.
            */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/room/:id" element={<RoomDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/receipt/:id" element={<RentReceipt />} />
              <Route path="/move-in-report/:id" element={<MoveInReport />} />
              <Route path="/move-out-report/:id" element={<MoveInReport />} />
              <Route path="/damages/:tenantId" element={<DamagesCalculator />} />
              <Route path="/tenant-cv/:tenantProfileId" element={<TenantCV />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
