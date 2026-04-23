import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Plus, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from './NotificationCenter';

/**
 * Header Component (Global).
 * WHAT IT DOES: Renders the top navigation bar with the REHWAS brand mark, navigation links, and dynamic auth state.
 * ANALOGY: The consistent dashboard of a car that stays with you regardless of which road you're driving on.
 */
export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { pathname } = useLocation();

  const isLinkActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) => `
    text-sm font-bold uppercase tracking-wider transition-all
    ${isLinkActive(path) 
      ? 'text-brand border-b-2 border-brand pb-1' 
      : 'text-slate-600 hover:text-brand'}
  `;

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo / Brand Mark */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="p-2 bg-brand/10 rounded-xl group-hover:bg-brand/20 transition-colors">
              <Building2 className="w-6 h-6 text-brand" />
            </div>
            <span className="text-2xl font-black text-brand tracking-tighter">REHWAS</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-10">
            <Link to="/discover" className={navLinkClass('/discover')}>Discover</Link>
            <Link to="/pricing" className={navLinkClass('/pricing')}>Pricing</Link>
            {profile?.role === 'landlord' && (
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>Management</Link>
            )}
            <a href="/#how-it-works" className="text-slate-600 hover:text-brand font-bold text-sm transition-colors uppercase tracking-wider">How it works</a>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
               <Link to="/login" className="px-6 py-2.5 bg-brand text-white font-bold rounded-xl hover:bg-emerald-600 shadow-sm hover:shadow-lg transition-all active:scale-95">
                Sign In
              </Link>
            ) : (
                <div className="flex items-center gap-4">
                  {profile?.role === 'landlord' && (
                    <Link to="/add-room" className="hidden sm:flex items-center gap-2 bg-brand text-white font-bold py-2.5 px-5 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                      <Plus size={18} />
                      <span>List Property</span>
                    </Link>
                  )}
                  <NotificationCenter />
                  <div className="relative">
                    <div 
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand transition-all"
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-50 uppercase">
                          {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>

                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[200]">
                        <div className="px-4 py-2 border-b border-slate-50 mb-1">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Signed in as</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                        </div>
                        <button 
                          onClick={() => { navigate('/settings'); setProfileMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-brand transition-colors"
                        >
                          Settings
                        </button>
                        <button 
                          onClick={() => { navigate('/pricing'); setProfileMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-brand transition-colors"
                        >
                          Pricing
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        <button 
                          onClick={() => { signOut(); setProfileMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
               </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 p-2 min-h-[44px]">
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-8 flex flex-col space-y-4 animate-in slide-in-from-top-2">
          <Link to="/discover" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-bold py-4 border-b border-slate-50">Discover Rooms</Link>
          <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-bold py-4 border-b border-slate-50">Pricing</Link>
          <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-bold py-4 border-b border-slate-50">How it works</a>
          
          <div className="flex flex-col gap-3 pt-4">
            {!user ? (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center px-5 py-4 bg-brand text-white font-bold rounded-2xl shadow-sm">
                Sign In
              </Link>
            ) : (
              <>
                <Link to="/add-room" onClick={() => setMobileMenuOpen(false)} className="text-center px-5 py-4 text-brand border-2 border-brand font-bold rounded-2xl">
                  List Your Property
                </Link>
                <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="text-center px-5 py-4 text-slate-700 border-2 border-slate-100 font-bold rounded-2xl">
                  Settings
                </Link>
                <Link to={profile?.role === 'landlord' ? "/dashboard" : "/discover"} onClick={() => setMobileMenuOpen(false)} className="text-center px-5 py-4 bg-brand text-white font-bold rounded-2xl shadow-sm">
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
