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
 * Hero Section Component.
 * WHAT IT DOES: The main introductory banner with the primary value proposition and call-to-action buttons.
 */
const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-surface to-emerald-100/50 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-dark tracking-tight max-w-4xl mx-auto leading-tight">
          Find your perfect room in India — <span className="text-brand">no broker, no hassle.</span>
        </h1>
        <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto font-medium">
          REHWAS connects tenants with verified landlords across Bengaluru, Pune & Mumbai. Rent smarter. Manage better.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => navigate('/discover')}
            className="w-full sm:w-auto px-10 py-5 min-h-[44px] bg-brand text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Browse Rooms <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/add-room')}
            className="w-full sm:w-auto px-10 py-5 min-h-[44px] bg-white text-dark text-lg font-bold rounded-2xl shadow border border-slate-200 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            List My Property <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto bg-white/60 backdrop-blur-xl border border-white/40 p-10 rounded-[2.5rem] shadow-sm">
          <div className="flex flex-col items-center">
            <div className="text-5xl font-black text-brand tracking-tighter"><AnimatedCounter end={2400} suffix="+" /></div>
            <div className="text-xs font-black text-slate-400 mt-2 uppercase tracking-widest">Rooms Listed</div>
          </div>
          <div className="flex flex-col items-center md:border-x border-slate-200/60">
            <div className="text-5xl font-black text-brand tracking-tighter"><AnimatedCounter end={8000} suffix="+" /></div>
            <div className="text-xs font-black text-slate-400 mt-2 uppercase tracking-widest">Happy Tenants</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-5xl font-black text-brand tracking-tighter"><AnimatedCounter end={0} prefix="₹" /></div>
            <div className="text-xs font-black text-slate-400 mt-2 uppercase tracking-widest">Broker Fee</div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * How It Works Component.
 */
const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Tenants Section */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-dark tracking-tight">How It Works <span className="text-brand">For Tenants</span></h2>
            <p className="mt-4 text-lg text-slate-500 font-medium">Find your next home in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Search, title: "1. Search on the Map", desc: "Filter by city, rent, and type. See real prices by area instead of endless lists." },
              { icon: MessageSquare, title: "2. Chat with Landlord", desc: "Connect directly in-app. No phone number shared until you're completely ready." },
              { icon: HomeIcon, title: "3. Move In", desc: "Enjoy verified listings, receive digital rent receipts, and experience zero hassle." }
            ].map((step, i) => (
              <div key={i} className="group bg-surface p-10 rounded-[2.5rem] text-center hover:-translate-y-2 transition-all border border-slate-50 hover:shadow-xl shadow-brand/5">
                <div className="w-20 h-20 bg-emerald-100/50 text-brand rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-dark mb-4">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Landlords Section */}
        <div id="for-landlords">
          <div className="text-center mb-16 pt-10">
            <h2 className="text-4xl font-black text-dark tracking-tight">How It Works <span className="text-indigo-600">For Landlords</span></h2>
            <p className="mt-4 text-lg text-slate-500 font-medium">Manage your properties effortlessly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Camera, title: "1. List in 5 minutes", desc: "Add photos, set rent, and drop a pin on the map. Your property goes live instantly.", color: "indigo" },
              { icon: Users, title: "2. Find Tenants", desc: "Receive visit requests from interested seekers and securely chat directly with them.", color: "indigo" },
              { icon: FileText, title: "3. Manage Everything", desc: "A KhataBook-style rent ledger, automated reminders, and digital receipts.", color: "indigo" }
            ].map((step, i) => (
              <div key={i} className="group bg-indigo-50/30 p-10 rounded-[2.5rem] text-center hover:-translate-y-2 transition-all border border-indigo-100/50 hover:shadow-xl shadow-indigo-500/5">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-dark mb-4">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

/**
 * Feature Highlights Component.
 */
const FeatureHighlights = () => {
  return (
    <section className="py-32 bg-surface border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-black text-dark mb-20 tracking-tight">Why choose REHWAS?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center max-w-sm mx-auto group">
            <div className="w-24 h-24 bg-white shadow-lg rounded-[2.5rem] rotate-6 flex items-center justify-center mb-8 border border-white group-hover:rotate-0 transition-all">
              <div className="w-full h-full -rotate-6 group-hover:rotate-0 flex items-center justify-center bg-blue-50 text-blue-500 rounded-[2.5rem] transition-all">
                <Map className="w-12 h-12" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-dark mb-4">Smart Map Discovery</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Browse real-time room prices by locality visually. No more scrolling through endless lists.</p>
          </div>
          <div className="flex flex-col items-center max-w-sm mx-auto group">
            <div className="w-24 h-24 bg-white shadow-lg rounded-[2.5rem] -rotate-6 flex items-center justify-center mb-8 border border-white group-hover:rotate-0 transition-all">
              <div className="w-full h-full rotate-6 group-hover:rotate-0 flex items-center justify-center bg-amber-50 text-amber-500 rounded-[2.5rem] transition-all">
                <BookOpen className="w-12 h-12" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-dark mb-4">Rent Ledger</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Easily track monthly rent, electricity bills, and arrears for every single tenant digitally.</p>
          </div>
          <div className="flex flex-col items-center max-w-sm mx-auto group">
            <div className="w-24 h-24 bg-white shadow-lg rounded-[2.5rem] rotate-3 flex items-center justify-center mb-8 border border-white group-hover:rotate-0 transition-all">
              <div className="w-full h-full -rotate-3 group-hover:rotate-0 flex items-center justify-center bg-brand/10 text-brand rounded-[2.5rem] transition-all">
                <ShieldCheck className="w-12 h-12" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-dark mb-4">Verified Listings</h3>
            <p className="text-slate-500 leading-relaxed font-medium">KYC-linked landlords and community reviews ensure you never face renting scams again.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Cities Section Component.
 */
const Cities = () => {
  const navigate = useNavigate();

  const cities = [
    { name: 'Bengaluru', count: '1,200+', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=600&h=400' },
    { name: 'Pune', count: '850+', img: 'https://images.unsplash.com/photo-1572913017567-02f06e300931?auto=format&fit=crop&q=80&w=600&h=400' },
    { name: 'Mumbai', count: '350+', img: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?auto=format&fit=crop&q=80&w=600&h=400' }
  ];

  return (
    <section id="cities" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-black text-dark mb-16 border-l-8 border-brand pl-6 tracking-tight">Available in</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {cities.map((city) => (
            <div 
              key={city.name}
              onClick={() => navigate(`/discover?city=${city.name.toLowerCase()}`)}
              className="group relative h-80 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <img 
                src={city.img} 
                alt={city.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent"></div>
              <div className="absolute bottom-10 left-8 right-8">
                <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                  <MapPin className="w-7 h-7 text-brand" /> {city.name}
                </h3>
                <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs">{city.count} active listings</p>
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
 */
const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-dark text-slate-400 py-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2 text-white cursor-pointer" onClick={() => navigate('/')}>
              <Building2 className="w-8 h-8 text-brand" />
              <span className="text-2xl font-black tracking-tight">REHWAS</span>
            </div>
            <p className="text-lg max-w-sm font-medium leading-relaxed">
              Making India's rental market transparent, efficient, and broker-free for both tenants and landlords.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Discovery</h4>
            <div className="flex flex-col gap-4 text-sm font-bold">
              <Link to="/discover" className="hover:text-brand transition-colors">Find a Room</Link>
              <Link to="/add-room" className="hover:text-brand transition-colors">List Property</Link>
              <a href="#cities" className="hover:text-brand transition-colors">Cities</a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Company</h4>
            <div className="flex flex-col gap-4 text-sm font-bold">
              <a href="#" className="hover:text-brand transition-colors">Help Center</a>
              <a href="#" className="hover:text-brand transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-brand transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm font-bold">
            Built with ❤️ for Bharat 🇮🇳
          </div>
          <div className="text-sm font-medium opacity-50">
            © {new Date().getFullYear()} REHWAS Technologies. All rights reserved.
          </div>
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

