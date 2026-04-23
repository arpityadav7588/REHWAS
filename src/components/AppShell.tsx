import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams, Outlet } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Users, 
  BookOpen, 
  Bell, 
  BarChart2, 
  FileText, 
  Zap, 
  Settings, 
  CreditCard, 
  HelpCircle, 
  ChevronDown, 
  LogOut, 
  User, 
  Menu, 
  X,
  Star,
  Sparkles,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { PlanBanner } from './PlanBanner';
import { NotificationBell } from './NotificationBell';

/**
 * UpgradeCelebration Component
 * 
 * WHY: SaaS is a relationship. When a user commits to a paid plan, 
 * we must reward them instantly. This celebration reduces "Buyer's Remorse" 
 * and marks the transition from "Visitor" to "Customer."
 */
const UpgradeCelebration = ({ plan }: { plan: string }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-500">
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-3 h-3 rounded-sm animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
    <div className="text-center space-y-6 animate-in zoom-in-95 duration-500 delay-300">
      <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
        <Sparkles size={48} className="text-white animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Welcome to {plan}! 🎉</h2>
        <p className="text-slate-400 font-bold max-w-sm mx-auto">All premium features are now unlocked. Your property empire just got an upgrade.</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-4 max-w-md mx-auto">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unlocked Now:</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check size={12} className="text-emerald-500" /></div>
            <p className="text-sm font-bold text-white">Up to 15 active room listings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check size={12} className="text-emerald-500" /></div>
            <p className="text-sm font-bold text-white">Professional P&L Reports</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check size={12} className="text-emerald-500" /></div>
            <p className="text-sm font-bold text-white">Advanced Rent Agreements</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  locked?: boolean;
}

const NavItem = ({ to, icon: Icon, label, active, onClick, locked }: NavItemProps) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-500 rounded-l-none' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      } ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <Icon className={`w-5 h-5 mr-3 transition-colors ${active ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span className="flex-1">{label}</span>
      {locked && (
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
          Pro
        </span>
      )}
    </Link>
  );
};

/**
 * AppShell Layout Component.
 * 
 * CORE INSIGHT: 
 * A left sidebar represents a "SaaS Workspace" (Notion, Linear, Slack).
 * It implies a permanent, tool-heavy environment where the user spends hours managing assets.
 * In contrast, a top navbar represents a "Website" or "Marketplace" (Amazon, Zomato).
 * It implies a transient visit where the user searches, views, and leaves.
 * 
 * ANALOGY: 
 * A sidebar is like your permanent office desk — everything is within arm's reach.
 * A top navbar is like a visitor's pass — you use it to find where you're going and then tuck it away.
 */
export const AppShell = ({ children }: { children?: React.ReactNode }) => {
  const { profile, signOut, isLandlord } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, currentTab]);

  const firstName = profile?.full_name?.split(' ')[0] || 'Landlord';
  const plan = profile?.plan || 'starter';
  const roomsCount = profile?.rooms_count || 0;
  const maxRooms = plan === 'starter' ? 3 : (plan === 'pro' ? 15 : 100);
  const roomProgress = (roomsCount / maxRooms) * 100;

  const [showCelebration, setShowCelebration] = useState(false);
  const [prevPlan, setPrevPlan] = useState(plan);

  // Upgrade Celebration Detection
  useEffect(() => {
    if (prevPlan === 'starter' && (plan === 'pro' || plan === 'business')) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
    setPrevPlan(plan);
  }, [plan, prevPlan]);

  const isTabActive = (tab: string) => location.pathname === '/dashboard' && currentTab === tab;
  const isPathActive = (path: string) => location.pathname === path && !currentTab;

  const NavSidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 overflow-y-auto no-scrollbar">
      {/* Workspace Header */}
        <div className="flex items-center justify-between gap-3 p-6 pb-4">
          <div 
            className="flex items-center gap-3 cursor-pointer group flex-1"
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-xs">
              R
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="font-black text-dark tracking-tighter text-lg uppercase">REHWAS</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {firstName}'s Portfolio
              </p>
            </div>
          </div>
          <NotificationBell />
        </div>

        {isWorkspaceDropdownOpen && (
          <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <button className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 bg-white rounded-lg shadow-sm border border-slate-200">
              {firstName}'s Portfolio
            </button>
            <button className="w-full text-left px-3 py-2 text-xs font-bold text-slate-400 hover:text-brand transition-colors mt-1">
              + New Workspace
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-8">
        {/* Main Nav */}
        <div className="space-y-1">
          <NavItem 
            to="/dashboard" 
            icon={Home} 
            label="Home" 
            active={isPathActive('/dashboard')} 
          />
        </div>

        {/* Manage Group */}
        <div className="space-y-1">
          <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Manage</h3>
          <NavItem 
            to="/dashboard?tab=rooms" 
            icon={Building2} 
            label="Rooms" 
            active={isTabActive('rooms')} 
          />
          <NavItem 
            to="/dashboard?tab=tenants" 
            icon={Users} 
            label="Tenants" 
            active={isTabActive('tenants')} 
          />
          <NavItem 
            to="/dashboard?tab=ledger" 
            icon={BookOpen} 
            label="Ledger" 
            active={isTabActive('ledger')} 
          />
          <NavItem 
            to="/dashboard?tab=reminders" 
            icon={Bell} 
            label="Reminders" 
            active={isTabActive('reminders')} 
          />
        </div>

        {/* Insights Group */}
        <div className="space-y-1">
          <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Insights</h3>
          <NavItem 
            to="/dashboard?tab=pl" 
            icon={BarChart2} 
            label="P&L Report" 
            active={isTabActive('pl')}
            locked={plan === 'starter'}
          />
          <NavItem 
            to="/settings/agreements" 
            icon={FileText} 
            label="Agreements" 
            active={isPathActive('/settings/agreements')}
            locked={plan === 'starter'}
          />
          <button 
            onClick={() => toast.success('Urja Splitter opened')} 
            className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
          >
            <Zap className="w-5 h-5 mr-3 text-slate-400" />
            <span>Urja Splitter</span>
          </button>
        </div>

        {/* Settings Group */}
        <div className="space-y-1">
          <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Settings</h3>
          <NavItem 
            to="/settings" 
            icon={Settings} 
            label="Settings" 
            active={isPathActive('/settings')} 
          />
          <NavItem 
            to="/settings/billing" 
            icon={CreditCard} 
            label="Plan & Billing" 
            active={isPathActive('/settings/billing')} 
          />
          <button 
            onClick={() => toast('Connecting to support...')} 
            className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
          >
            <HelpCircle className="w-5 h-5 mr-3 text-slate-400" />
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* Footer Area: Plan Awareness */}
      <div className="p-4 mt-auto border-t border-slate-50 space-y-4">
        {/* Plan Badge & Usage Meter */}
        <div className={`p-4 rounded-2xl border transition-all duration-500 ${
          roomProgress >= 100 ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-500 animate-pulse-ring' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${roomProgress >= 100 ? 'text-rose-600' : 'text-dark'}`}>
              {plan === 'starter' ? 'Starter Plan' : (plan === 'pro' ? 'Pro Plan' : 'Business Plan')}
            </span>
            {plan !== 'starter' && <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className={`text-xs font-bold ${roomProgress >= 100 ? 'text-rose-600' : 'text-slate-500'}`}>
                {roomsCount} of {maxRooms} rooms
              </span>
              <span className={`text-[10px] font-black ${roomProgress >= 100 ? 'text-rose-400' : 'text-slate-400'}`}>
                {Math.round(roomProgress)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  roomProgress >= 100 ? 'bg-rose-500 animate-pulse' : 
                  roomProgress >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, roomProgress)}%` }}
              />
            </div>
          </div>

          {plan === 'starter' && (
            <Link 
              to="/pricing"
              className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${
                roomProgress >= 100 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20 hover:bg-rose-700' 
                  : 'text-emerald-600 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Upgrade to Pro <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* User Row */}
        <div className="relative">
          <button 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group"
          >
            <div className="w-9 h-9 bg-dark rounded-full flex items-center justify-center text-white font-black text-sm uppercase">
              {firstName[0]}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-black text-dark truncate tracking-tight">{profile?.full_name}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight lowercase">
                {profile?.phone || 'landlord@rehwas.com'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              <Link 
                to="/profile" 
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-dark rounded-xl transition-all"
              >
                <User className="w-4 h-4" /> My Profile
              </Link>
              <button 
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If not a landlord, just render children (existing header/footer handles them)
  if (!isLandlord) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] fixed inset-y-0 z-40">
        <NavSidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-dark/40 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 w-[280px] bg-white z-[60] lg:hidden transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-full relative">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-6 right-4 p-2 text-slate-400 hover:text-dark transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <NavSidebar />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">
        {/* Mobile Header Top Bar */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-[10px]">
              R
            </div>
            <span className="font-black text-dark tracking-tighter text-base uppercase">REHWAS</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-slate-50 text-slate-600 rounded-xl"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <PlanBanner />
          {children || <Outlet />}
        </main>
        {showCelebration && <UpgradeCelebration plan={plan === 'pro' ? 'Pro' : 'Business'} />}
      </div>
    </div>
  );
};