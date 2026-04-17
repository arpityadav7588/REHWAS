import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Header Component (Global).
 * WHAT IT DOES: Renders the top navigation bar with the REHWAS brand mark, navigation links, and dynamic auth state.
 * ANALOGY: The consistent dashboard of a car that stays with you regardless of which road you're driving on.
 */
export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

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
            <Link to="/discover" className="text-slate-600 hover:text-brand font-bold text-sm transition-colors uppercase tracking-wider">Discover</Link>
            {profile?.role === 'landlord' && (
              <Link to="/dashboard" className="text-slate-600 hover:text-brand font-bold text-sm transition-colors uppercase tracking-wider">Management</Link>
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
                  <Link to={profile?.role === 'landlord' ? "/add-room" : "/discover"} className="px-5 py-2.5 text-brand border-2 border-brand font-bold rounded-xl hover:bg-emerald-50 transition-colors text-sm">
                    {profile?.role === 'landlord' ? 'List Property' : 'Find Home'}
                  </Link>
                  <div 
                    onClick={() => navigate(profile?.role === 'landlord' ? '/dashboard' : '/discover')}
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
