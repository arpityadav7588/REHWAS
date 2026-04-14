import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, X, ArrowRight, Search, MessageSquare, Home as HomeIcon, 
  Camera, Users, FileText, Map, BookOpen, ShieldCheck, MapPin, Building2 
} from 'lucide-react';

/**
 * Animated Counter Component.
 * WHAT IT DOES: Incrementally counts up from 0 to a target number over a specified duration.
 * ANALOGY: A car's speedometer dial rolling up as you accelerate.
 */
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }: { end: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing function for smoother slowdown at the end (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

/**
 * Navbar Component.
 * WHAT IT DOES: Renders the top navigation bar with branding, desktop links, and a mobile hamburger menu.
 * ANALOGY: The main directory sign at the entrance of a business park helping you navigate.
 */
const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Building2 className="w-8 h-8 text-brand" />
            <span className="text-2xl font-bold text-brand tracking-tight">REHWAS</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-slate-600 hover:text-brand font-medium transition-colors">How it works</a>
            <a href="#for-landlords" className="text-slate-600 hover:text-brand font-medium transition-colors">For Landlords</a>
            <a href="#cities" className="text-slate-600 hover:text-brand font-medium transition-colors">Cities</a>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/add-room" className="px-5 py-2.5 text-brand border-2 border-brand font-semibold rounded-xl hover:bg-emerald-50 transition-colors">
              List Your Property
            </Link>
            <Link to="/discover" className="px-5 py-2.5 bg-brand text-white font-semibold rounded-xl hover:bg-emerald-600 shadow-sm hover:shadow transition-all active:scale-95">
              Find a Room
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600">
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 flex flex-col space-y-4 animate-in slide-in-from-top-2">
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium py-3 min-h-[44px] flex items-center">How it works</a>
          <a href="#for-landlords" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium py-3 min-h-[44px] flex items-center">For Landlords</a>
          <a href="#cities" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium py-3 min-h-[44px] flex items-center">Cities</a>
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <Link to="/add-room" className="text-center px-5 py-3 text-brand border-2 border-brand font-semibold rounded-xl">
              List Your Property
            </Link>
            <Link to="/discover" className="text-center px-5 py-3 bg-brand text-white font-semibold rounded-xl shadow-sm">
              Find a Room
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

/**
 * Hero Section Component.
 * WHAT IT DOES: The main introductory banner with the primary value proposition, call-to-action buttons, and animated stats.
 * ANALOGY: The eye-catching billboard outside a grand opening event that tells you exactly why you should come in.
 */
const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-surface to-emerald-100/50 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-dark tracking-tight max-w-4xl mx-auto leading-tight">
          Find your perfect room in India — <span className="text-brand">no broker, no hassle.</span>
        </h1>
        <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
          REHWAS connects tenants with verified landlords across Bengaluru, Pune & Mumbai. Rent smarter. Manage better.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => navigate('/discover')}
            className="w-full sm:w-auto px-8 py-4 min-h-[44px] bg-brand text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Browse Rooms <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/add-room')}
            className="w-full sm:w-auto px-8 py-4 min-h-[44px] bg-white text-dark text-lg font-bold rounded-2xl shadow border border-slate-200 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            List My Property <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto bg-white/60 backdrop-blur border border-white/40 p-8 rounded-3xl shadow-sm">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-extrabold text-brand"><AnimatedCounter end={2400} suffix="+" /></div>
            <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">Rooms Listed</div>
          </div>
          <div className="flex flex-col items-center md:border-x border-slate-200/60">
            <div className="text-4xl font-extrabold text-brand"><AnimatedCounter end={8000} suffix="+" /></div>
            <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">Happy Tenants</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-extrabold text-brand"><AnimatedCounter end={0} prefix="₹" /></div>
            <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">Broker Fee</div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * How It Works Component (For Tenants & Landlords).
 * WHAT IT DOES: Explains the step-by-step process of using the app for both user types using icons and cards.
 * ANALOGY: An instruction manual that visually shows how to assemble a piece of furniture in 3 easy steps.
 */
const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Tenants Section */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark">How It Works <span className="text-brand">For Tenants</span></h2>
            <p className="mt-4 text-lg text-slate-500">Find your next home in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface p-8 rounded-3xl text-center hover:-translate-y-1 transition-transform border border-slate-100">
              <div className="w-16 h-16 bg-emerald-100 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">1. Search on the Map</h3>
              <p className="text-slate-600">Filter by city, rent, and type. See real prices by area instead of endless lists.</p>
            </div>
            <div className="bg-surface p-8 rounded-3xl text-center hover:-translate-y-1 transition-transform border border-slate-100">
              <div className="w-16 h-16 bg-emerald-100 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">2. Chat with Landlord</h3>
              <p className="text-slate-600">Connect directly in-app. No phone number shared until you're completely ready.</p>
            </div>
            <div className="bg-surface p-8 rounded-3xl text-center hover:-translate-y-1 transition-transform border border-slate-100">
              <div className="w-16 h-16 bg-emerald-100 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
                <HomeIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">3. Move In</h3>
              <p className="text-slate-600">Enjoy verified listings, receive digital rent receipts, and experience zero hassle.</p>
            </div>
          </div>
        </div>

        {/* Landlords Section */}
        <div id="for-landlords">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark">How It Works <span className="text-brand">For Landlords</span></h2>
            <p className="mt-4 text-lg text-slate-500">Manage your properties effortlessly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-indigo-50/50 p-8 rounded-3xl text-center hover:-translate-y-1 transition-transform border border-indigo-50">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">1. List in 5 minutes</h3>
              <p className="text-slate-600">Add photos, set rent, and drop a pin on the map. Your property goes live instantly.</p>
            </div>
            <div className="bg-indigo-50/50 p-8 rounded-3xl text-center hover:-translate-y-1 transition-transform border border-indigo-50">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">2. Find Tenants</h3>
              <p className="text-slate-600">Receive visit requests from interested seekers and securely chat directly with them.</p>
            </div>
            <div className="bg-indigo-50/50 p-8 rounded-3xl text-center hover:-translate-y-1 transition-transform border border-indigo-50">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">3. Manage Everything</h3>
              <p className="text-slate-600">A KhataBook-style rent ledger, automated reminders, and digital receipts—all in one place.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

/**
 * Feature Highlights Component.
 * WHAT IT DOES: Showcases the core proprietary features of the platform.
 * ANALOGY: The special features list on a car brochure that sets it apart from competitors.
 */
const FeatureHighlights = () => {
  return (
    <section className="py-24 bg-surface border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-dark mb-16">Why choose REHWAS?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-white shadow-sm rounded-[2rem] rotate-3 flex items-center justify-center mb-6 border border-slate-100">
              <div className="w-full h-full -rotate-3 flex items-center justify-center bg-blue-50 text-blue-500 rounded-[2rem]">
                <Map className="w-10 h-10" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-dark mb-4">Smart Map Discovery</h3>
            <p className="text-slate-600 leading-relaxed">Browse real-time room prices by locality visually. No more scrolling through endless lists and making guesswork.</p>
          </div>
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-white shadow-sm rounded-[2rem] rotate-[-5deg] flex items-center justify-center mb-6 border border-slate-100">
              <div className="w-full h-full rotate-5 flex items-center justify-center bg-amber-50 text-gold rounded-[2rem]">
                <BookOpen className="w-10 h-10" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-dark mb-4">KhataBook-style Ledger</h3>
            <p className="text-slate-600 leading-relaxed">Landlords can easily track monthly rent, electricity bills, and arrears for every single tenant digitally.</p>
          </div>
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-white shadow-sm rounded-[2rem] rotate-3 flex items-center justify-center mb-6 border border-slate-100">
              <div className="w-full h-full -rotate-3 flex items-center justify-center bg-emerald-50 text-brand rounded-[2rem]">
                <ShieldCheck className="w-10 h-10" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-dark mb-4">Verified Listings</h3>
            <p className="text-slate-600 leading-relaxed">KYC-linked landlords and crowd-sourced tenant reviews ensure you never face renting scams again.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Cities Section Component.
 * WHAT IT DOES: Displays cards for the active cities where the platform operates, redirecting users to the map filtered by city.
 * ANALOGY: A travel agency's window showing top destinations you can visit.
 */
const Cities = () => {
  const navigate = useNavigate();

  const cities = [
    { name: 'Bengaluru', count: '1,200+', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=600&h=400' },
    { name: 'Pune', count: '850+', img: 'https://images.unsplash.com/photo-1572913017567-02f06e300931?auto=format&fit=crop&q=80&w=600&h=400' },
    { name: 'Mumbai', count: '350+', img: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?auto=format&fit=crop&q=80&w=600&h=400' }
  ];

  return (
    <section id="cities" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-dark mb-12 border-l-4 border-brand pl-4">Available in</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {cities.map((city) => (
            <div 
              key={city.name}
              onClick={() => navigate(`/discover?city=${city.name.toLowerCase()}`)}
              className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <img 
                src={city.img} 
                alt={city.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand" /> {city.name}
                </h3>
                <p className="text-emerald-100 font-medium">{city.count} rooms active</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * Footer Component.
 * WHAT IT DOES: Renders the bottom footer with branding and legal links.
 * ANALOGY: The fine print and contact information on the back cover of a book.
 */
const Footer = () => {
  return (
    <footer className="bg-dark text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 text-white">
            <Building2 className="w-6 h-6 text-brand" />
            <span className="text-xl font-bold tracking-tight">REHWAS</span>
          </div>
          <p className="text-sm">Built for Bharat 🇮🇳</p>
        </div>

        <div className="flex gap-6 text-sm">
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>

        <div className="text-sm">
          © {new Date().getFullYear()} REHWAS. Making India's rental market transparent.
        </div>
      </div>
    </footer>
  );
};

/**
 * The Main Home Page Component.
 * WHAT IT DOES: Assembles all the individual sections into the final public landing page.
 * NOTE ON RESPONSIVENESS: Uses `md:` for desktop-first styles, enforcing vertical stacking and `w-full` utilities natively on mobile while collapsing the `Navbar` to a hamburger menu. Tap targets are rigorously set using `min-h-[44px]`.
 * ANALOGY: The master blueprint that puts all the building blocks (rooms, walls, doors) together into a finished house.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-surface font-sans selection:bg-brand/20 select-none">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeatureHighlights />
        <Cities />
      </main>
      <Footer />
    </div>
  );
}
