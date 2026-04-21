import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
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
import { MoveInReportView } from '@/components/MoveInReportView';
import { RentBuddy } from '@/components/RentBuddy';

import Pricing from '@/pages/Pricing';
import Notifications from '@/pages/Notifications';


const queryClient = new QueryClient();

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
          <div className="min-h-screen bg-surface flex flex-col">
            <Header />
            <PlanStatusBanner />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/room/:id" element={<RoomDetail />} />
                <Route path="/dashboard" element={<LandlordDashboard />} />
                <Route path="/add-room" element={<AddRoom />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/login" element={<Login />} />
                <Route path="/receipt/:id" element={<RentReceipt />} />
                <Route path="/move-in-report/:id" element={<MoveInReportView />} />
              </Routes>
            </main>
            <RentBuddy />
          </div>

        </AuthProvider>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}


export default App;
