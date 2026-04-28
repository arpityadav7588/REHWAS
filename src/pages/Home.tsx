import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, MessageSquare, Check, Star, Smartphone, Shield,
  Zap, BookOpen, FileText, Calendar, BarChart2, Map, Building2, Users,
  ShieldCheck, Lock, Camera, TrendingUp
} from 'lucide-react';

/**
 * SAAS MARKETING PRINCIPLE: SELL THE OUTCOME, NOT THE FEATURE.
 * 
 * Instead of "Here is a table," we sell "Run your rentals like a business."
 * Landlords are looking for control, transparency, and reclaimed time.
 * This landing page targets the pain points of manual management.
 */

// --- Components ---

/**
 * Product Hero Mockup
 * WHY: High-end SaaS products show the "Inside" to build trust.
 * This is a styled HTML representation of the rent ledger dashboard.
 */
const ProductHero = ({ persona }: { persona: 'landlord' | 'tenant' }) => (
  <div className="relative mt-20 max-w-5xl mx-auto p-4 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 border border-slate-800 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
    
    {/* Browser Header */}
    <div className="flex items-center gap-2 mb-4 px-4 py-2 border-b border-slate-800">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-rose-500/20" />
        <div className="w-3 h-3 rounded-full bg-amber-500/20" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
      </div>
      <div className="mx-auto bg-slate-800/50 rounded-lg px-4 py-1 text-[10px] text-slate-500 font-mono">
        {persona === 'landlord' ? 'rehwas.in/dashboard/ledger' : 'rehwas.in/discover/room-72b'}
      </div>
    </div>

    {/* Mock Dashboard UI */}
    <div className="p-4 grid grid-cols-12 gap-4">
      {/* Sidebar Mock */}
      <div className="col-span-3 space-y-3 opacity-40 hidden md:block">
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className={`h-4 rounded w-full border ${persona === 'landlord' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-slate-800 border-transparent'}`} />
        <div className="h-4 bg-slate-800 rounded w-2/3" />
        <div className="h-24 bg-slate-800/50 rounded-xl mt-10" />
      </div>

      {/* Main Content Mock */}
      <div className="col-span-12 md:col-span-9 space-y-6">
        {persona === 'landlord' ? (
          <>
            <div className="flex justify-between items-center">
              <div className="h-8 bg-slate-700 rounded-lg w-48" />
              <div className="flex gap-2">
                <div className="h-8 bg-emerald-500 rounded-lg w-24" />
                <div className="h-8 bg-slate-800 rounded-lg w-8" />
              </div>
            </div>

            {/* Ledger Matrix */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase">Tenant</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">JAN</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">FEB</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">MAR</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 font-bold text-xs">
                  {[
                    { name: 'Aditya K.', status: ['emerald', 'emerald', 'emerald'] },
                    { name: 'Sonal M.', status: ['emerald', 'emerald', 'amber'] },
                    { name: 'Rahul V.', status: ['emerald', 'rose', 'rose'] },
                    { name: 'Megha S.', status: ['emerald', 'emerald', 'emerald'] }
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="p-4 text-white">{row.name}</td>
                      {row.status.map((st, j) => (
                        <td key={j} className="p-4">
                          <div className={`h-6 w-full rounded-md flex items-center justify-center ${
                            st === 'emerald' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                            st === 'amber' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                          }`}>
                            {st === 'emerald' ? 'PAID' : st === 'amber' ? 'DUE' : 'MISS'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-slate-800/50 rounded-2xl border border-slate-700 p-4 space-y-2">
                <div className="h-2 bg-slate-600 rounded w-1/2" />
                <div className="h-6 bg-emerald-500/20 rounded w-3/4" />
              </div>
              <div className="h-20 bg-slate-800/50 rounded-2xl border border-slate-700 p-4 space-y-2">
                <div className="h-2 bg-slate-600 rounded w-1/2" />
                <div className="h-6 bg-amber-500/20 rounded w-3/4" />
              </div>
              <div className="h-20 bg-slate-800/50 rounded-2xl border border-slate-700 p-4 space-y-2">
                <div className="h-2 bg-slate-600 rounded w-1/2" />
                <div className="h-6 bg-rose-500/20 rounded w-3/4" />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="aspect-video bg-slate-800 rounded-3xl border border-slate-700 flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
               <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                 <Camera className="w-8 h-8 text-white" />
               </div>
               <div className="absolute bottom-6 left-6 right-6">
                 <div className="h-4 bg-white/20 rounded w-1/3 mb-2" />
                 <div className="h-2 bg-white/10 rounded w-1/2" />
               </div>
               <div className="absolute top-6 right-6 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                 Live Night View
               </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="h-4 bg-slate-600 rounded w-24" />
                   <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 </div>
                 <div className="text-3xl font-black text-white italic">A+ Grade</div>
                 <div className="h-2 bg-slate-700 rounded w-full" />
               </div>
               <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 space-y-4">
                 <div className="h-4 bg-slate-600 rounded w-24" />
                 <div className="text-3xl font-black text-white italic">₹14,500</div>
                 <div className="flex gap-1">
                   {[1,2,3,4,5].map(s => <Star key={s} size={10} fill="#fbbf24" className="text-amber-400" />)}
                 </div>
               </div>
            </div>
            <div className="h-14 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-white uppercase tracking-widest text-sm shadow-xl shadow-emerald-900/20">
              Direct Contact Landlord
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-dark px-6 py-2 rounded-full shadow-xl font-black text-xs uppercase tracking-widest border border-slate-100 z-20 whitespace-nowrap">
      {persona === 'landlord' ? 'The landlord dashboard that actually makes sense' : 'Rent with verified trust and transparency'}
    </div>
  </div>
);

/**
 * Feature Card Component
 */
const FeatureCard = ({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) => (
  <div className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-emerald-100 transition-all hover:shadow-2xl hover:shadow-emerald-500/5">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${color}`}>
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-black text-dark mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

/**
 * Testimonial Card
 */
const Testimonial = ({ name, location, roles, text, initial }: { name: string, location: string, roles: string, text: string, initial: string }) => (
  <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative">
    <div className="absolute top-8 right-8 text-emerald-500/20 font-serif text-6xl">"</div>
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 font-black shadow-sm">
        {initial}
      </div>
      <div>
        <p className="font-black text-dark tracking-tight">{name}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{location} · {roles}</p>
      </div>
    </div>
    <p className="text-slate-600 font-medium leading-relaxed italic">"{text}"</p>
  </div>
);

/**
 * Pricing Preview Component
 */
const PricingPreview = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
    {[
      { name: 'Starter', price: '0', desc: 'Up to 3 rooms', cta: 'Get started free', feat: ['Rent ledger', 'WhatsApp reminders'] },
      { name: 'Pro', price: '499', desc: 'Up to 15 rooms', cta: 'Start 14-day trial', feat: ['P&L Dashboard', 'Electricity Splitter'], popular: true },
      { name: 'Business', price: '1,499', desc: 'Unlimited rooms', cta: 'Start 14-day trial', feat: ['Rent Agreements', 'Team seats'] }
    ].map((plan, i) => (
      <div key={i} className={`p-8 rounded-[2.5rem] bg-white border flex flex-col transition-all hover:-translate-y-1 ${
        plan.popular ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 scale-105' : 'border-slate-100'
      }`}>
        {plan.popular && (
          <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase self-center -mt-11 mb-7 tracking-widest">Most Popular</div>
        )}
        <h4 className="text-lg font-black text-dark mb-1">{plan.name}</h4>
        <p className="text-xs text-slate-400 font-bold mb-6">{plan.desc}</p>
        <div className="flex items-baseline gap-1 mb-8">
          <span className="text-sm font-black">₹</span>
          <span className="text-4xl font-black">{plan.price}</span>
          <span className="text-slate-400 text-xs font-bold">/mo</span>
        </div>
        <div className="space-y-3 mb-10 flex-1">
          {plan.feat.map((f, j) => (
            <div key={j} className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Check size={14} className="text-emerald-500" strokeWidth={4} /> {f}
            </div>
          ))}
        </div>
        <Link 
          to="/login" 
          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-center transition-all ${
            plan.popular ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-900 text-white'
          }`}
        >
          {plan.cta}
        </Link>
      </div>
    ))}
  </div>
);

// --- Main Page ---

export default function Home() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState<'landlord' | 'tenant'>('landlord');

  const content = {
    landlord: {
      badge: "Built for Indian Landlords",
      headline: <>Run your rental properties <br className="hidden md:block" /> <span className="text-emerald-600">like a business.</span></>,
      subheadline: "REHWAS is property management software for Indian landlords — rent tracking, tenant management, utility billing, and verified tenant discovery in one place.",
      cta: "Start free — no credit card",
      secondary: "See how it works",
      socialProof: "Trusted by 2,400+ landlords"
    },
    tenant: {
      badge: "For the Modern Indian Tenant",
      headline: <>Find your next home <br className="hidden md:block" /> <span className="text-emerald-600">without the drama.</span></>,
      subheadline: "REHWAS is the trust-first rental ecosystem. Verified landlords, secure deposits, and honest street-safety videos from people who actually live there.",
      cta: "Find a Room — No Broker",
      secondary: "Check your Rent Grade",
      socialProof: "Join 15,000+ verified seekers"
    }
  };

  const features = {
    landlord: [
      { icon: BookOpen, title: "Smart Rent Ledger", desc: "A Matrix-view of your portfolio. Track who paid, who's due, and who's missing at a glance.", color: "bg-emerald-50 text-emerald-600" },
      { icon: Zap, title: "Urja Bill Splitter", desc: "Divide shared electricity and water bills among tenants with one click. Send to WhatsApp instantly.", color: "bg-blue-50 text-blue-600" },
      { icon: FileText, title: "Digital Records", desc: "Store tenant KYC, dossiers, and receipts in the cloud. Never lose a rent agreement again.", color: "bg-amber-50 text-amber-600" },
      { icon: Calendar, title: "Lease Calendar", desc: "Automatic alerts for renewals and dues. Know exactly when a lease is ending.", color: "bg-purple-50 text-purple-600" },
      { icon: BarChart2, title: "P&L Reports", desc: "Detailed income vs expense reports. Know your actual property yield. Ready for your CA.", color: "bg-rose-50 text-rose-600" },
      { icon: Smartphone, title: "WhatsApp Reminders", desc: "Professional, polite payment reminders sent via WhatsApp. Replaces awkward collections.", color: "bg-emerald-50 text-emerald-600" }
    ],
    tenant: [
      { icon: ShieldCheck, title: "Bhoomi Score", desc: "Verify landlord identity and property authenticity before you pay a single rupee.", color: "bg-emerald-50 text-emerald-600" },
      { icon: Lock, title: "Deposit Vault", desc: "Secure your security deposit in our escrow. Released only after a mutual move-in report.", color: "bg-blue-50 text-blue-600" },
      { icon: Camera, title: "Street Night View", desc: "Real videos of the street at night uploaded by residents. See the lighting and safety for yourself.", color: "bg-amber-50 text-amber-600" },
      { icon: TrendingUp, title: "Rent Health Grade", desc: "Build a premium renter profile by paying on time. Get lower deposits on your next home.", color: "bg-purple-50 text-purple-600" },
      { icon: FileText, title: "Digital Receipts", desc: "Every payment generates a professional, CA-approved rent receipt for your HRA claims.", color: "bg-rose-50 text-rose-600" },
      { icon: MessageSquare, title: "Direct Chat", desc: "Talk directly to landlords. No brokers, no hidden fees, and no middleman drama.", color: "bg-emerald-50 text-emerald-600" }
    ]
  };

  const active = content[persona];
  const activeFeatures = features[persona];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 select-none overflow-x-hidden">
      
      {/* Section 0: Hero 
          STRATEGY: Emotional Hook. Shift from "Find a Room" to "Control your business."
      */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          
          {/* Persona Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
              <button 
                onClick={() => setPersona('landlord')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  persona === 'landlord' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Landlord
              </button>
              <button 
                onClick={() => setPersona('tenant')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  persona === 'tenant' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Tenant
              </button>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <Zap size={14} fill="currentColor" />
            <span className="text-xs font-black uppercase tracking-widest">{active.badge}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-dark tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {active.headline}
          </h1>
          
          <p className="mt-6 text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {active.subheadline}
          </p>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6 animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <button 
              onClick={() => navigate(persona === 'landlord' ? '/login' : '/discover')}
              className="px-10 py-5 bg-emerald-600 text-white text-lg font-black rounded-2xl shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {active.cta} <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href={persona === 'landlord' ? "#product" : "/profile"}
              className="px-10 py-5 bg-white text-dark text-lg font-black rounded-2xl border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {active.secondary}
            </a>
          </div>

          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-in fade-in duration-1000 delay-700">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <Check size={12} className="text-emerald-500" strokeWidth={4} /> Free forever for up to 3 rooms
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <Users size={12} className="text-emerald-500" /> {active.socialProof}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              🇮🇳 Made in India
            </div>
          </div>
        </div>

        <div id="product" className="px-6">
          <ProductHero persona={persona} />
        </div>
      </section>

      {/* Section 1: Core Software Features 
          STRATEGY: Direct Value Prop. Solve the primary pain: "Where is my money?"
      */}
      <section className="py-32 lg:py-48 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-dark tracking-tight mb-6">
              {persona === 'landlord' ? "Everything your properties need" : "Everything you need for a safe home"}
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              {persona === 'landlord' 
                ? "Stop using notebooks and WhatsApp messages. Use the first property engine built for the Indian rental market."
                : "Stop falling for fake listings and broker drama. Use the first rental ecosystem built for trust."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {activeFeatures.map((feat, i) => (
              <FeatureCard 
                key={i}
                icon={feat.icon}
                title={feat.title}
                desc={feat.desc}
                color={feat.color}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Discovery Feature 
          STRATEGY: The "Marketing Bonus". Position the marketplace as a tool for landlords.
      */}
      <section className="py-32 lg:py-48 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[120px] -mr-[400px] -mt-[400px]" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
          <div className="flex-1 space-y-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
              <Map size={14} />
              <span className="text-xs font-black uppercase tracking-widest">
                {persona === 'landlord' ? "Bonus Feature: Discovery" : "The Discovery Map"}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.9]">
              {persona === 'landlord' ? <>{'Find tenants,'} <br /> <span className="text-emerald-500">not brokers.</span></> : <>{'Find a home,'} <br /> <span className="text-emerald-500">not a headache.</span></>}
            </h2>
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              {persona === 'landlord' 
                ? "When you need to fill a vacancy, REHWAS puts your room on a live map that tenants are actively browsing. No listing fees, no broker commissions."
                : "Browse thousands of verified rooms on a live map. Talk directly to landlords, see locality safety trends, and skip the broker fees entirely."
              }
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-emerald-400 font-black text-sm">
                <Check size={18} strokeWidth={4} /> ZERO COMMISSION
              </div>
              <div className="flex items-center gap-4 text-emerald-400 font-black text-sm">
                <Check size={18} strokeWidth={4} /> LIVE MAP LISTINGS
              </div>
              <div className="flex items-center gap-4 text-emerald-400 font-black text-sm">
                <Check size={18} strokeWidth={4} /> {persona === 'landlord' ? "VERIFIED SEEKERS ONLY" : "DIRECT LANDLORD CONTACT"}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            {/* Map Preview Mockup */}
            <div className="aspect-square bg-slate-800 rounded-[3rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/77.5946,12.9716,12,0/600x600?access_token=pk.eyJ1IjoicmVod2FzIiwiYSI6ImNscnd...') ] opacity-50 grayscale" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center animate-ping opacity-20" />
                <div className="w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-lg absolute" />
                
                <div className="absolute top-1/3 left-1/4 translate-y-10">
                   <div className="bg-white text-dark px-3 py-1.5 rounded-full font-black text-xs shadow-xl animate-bounce">₹12,500</div>
                </div>
                <div className="absolute top-1/2 right-1/4">
                   <div className="bg-white text-dark px-3 py-1.5 rounded-full font-black text-xs shadow-xl">₹18,000</div>
                </div>
              </div>
              <div className="absolute bottom-10 left-10 right-10 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 transform transition-transform group-hover:translate-y-2">
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Live Demand</p>
                <p className="text-sm font-bold text-white">
                  {persona === 'landlord' ? '"14 tenants browsing in Indiranagar right now"' : '"3 new verified rooms added in your locality today"'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Social Proof 
          STRATEGY: Validation. Show that "Real people in India use this."
      */}
      <section className="py-32 lg:py-48 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-dark tracking-tight mb-6">Built for the way India rents</h2>
            <p className="text-lg text-slate-500 font-medium">
              {persona === 'landlord' 
                ? "Join 2,400+ landlords across Bengaluru, Pune, and Mumbai who reclaimed their weekends with REHWAS."
                : "Join 15,000+ tenants who found safer, broker-free homes and protected their security deposits."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {persona === 'landlord' ? (
              <>
                <Testimonial 
                  name="Ramesh S."
                  location="Bengaluru"
                  roles="8 rooms"
                  initial="RS"
                  text="I used to track rent in a notebook. REHWAS replaced my entire system. I see who hasn't paid in 2 seconds."
                />
                <Testimonial 
                  name="Priya M."
                  location="Pune"
                  roles="3 rooms"
                  initial="PM"
                  text="The WhatsApp reminder button saved me 3 awkward conversations this month. Professional and effective."
                />
                <Testimonial 
                  name="Sunita A."
                  location="Mumbai"
                  roles="15 PG beds"
                  initial="SA"
                  text="The electricity splitter alone is worth the subscription. Used to take me 30 minutes every month manually."
                />
              </>
            ) : (
              <>
                <Testimonial 
                  name="Kavya R."
                  location="Bengaluru"
                  roles="Software Engineer"
                  initial="KR"
                  text="The Street Night View videos were a game changer. I could see the street lighting and vibe before visiting."
                />
                <Testimonial 
                  name="Arjun M."
                  location="Pune"
                  roles="Student"
                  initial="AM"
                  text="No broker fees and the Bhoomi Score gave me confidence that the landlord was legit. Best app for students."
                />
                <Testimonial 
                  name="Sneha K."
                  location="Mumbai"
                  roles="Creative Designer"
                  initial="SK"
                  text="The Deposit Vault is so needed in India. I finally felt my money was safe until the move-in report was signed."
                />
              </>
            )}
          </div>

          {/* Section 5 Highlights: India Specifics */}
          <div className="mt-32 grid grid-cols-2 md:grid-cols-5 gap-10 opacity-60">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-3xl font-black">₹</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Rupee Native</p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <MessageSquare size={30} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">WhatsApp-First</p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <Zap size={30} className="text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">UPI Integrated</p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <Shield size={30} className="text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">Aadhaar Ready</p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <Smartphone size={30} className="text-slate-900" />
              <p className="text-[10px] font-black uppercase tracking-widest">Android Optimized</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Pricing Preview 
          STRATEGY: Transparency. SaaS buyers want to see the price before they sign up.
      */}
      {persona === 'landlord' && (
        <section className="py-32 lg:py-48 px-6 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-black text-dark tracking-tight mb-6">Simple, transparent pricing</h2>
              <Link to="/pricing" className="text-emerald-600 font-black flex items-center justify-center gap-2 hover:underline">
                View full pricing details <ArrowRight size={18} />
              </Link>
            </div>

            <PricingPreview />
          </div>
        </section>
      )}

      {/* NEW BOTTOM CTA BANNER 
          STRATEGY: The "Closer". Final push to get the conversion.
      */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto bg-emerald-600 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-1000" />
          
          <div className="relative z-10 max-w-4xl mx-auto space-y-10">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1]">
              {persona === 'landlord' ? "Ready to manage your properties the smart way?" : "Ready to find your perfect home?"}
            </h2>
            <p className="text-xl text-emerald-50 font-medium">
              {persona === 'landlord' 
                ? "Join 2,400+ landlords already using REHWAS to save 10+ hours of management every month."
                : "Join 15,000+ tenants using REHWAS to rent with trust and transparency."
              }
            </p>
            
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={() => navigate(persona === 'landlord' ? '/login' : '/discover')}
                className="px-12 py-6 bg-white text-emerald-700 text-xl font-black rounded-2xl shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                {persona === 'landlord' ? "Start free today" : "Find a Room Now"} <ArrowRight className="w-6 h-6" />
              </button>
              <p className="text-sm font-black text-emerald-200 uppercase tracking-widest">
                {persona === 'landlord' ? "No credit card required · Cancel anytime · Free for up to 3 rooms" : "Zero Brokerage · Verified Listings · Aadhaar Secured"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer 
          STRATEGY: Authority and Compliance.
      */}
      <footer className="bg-white border-t border-slate-100 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-emerald-600" />
                <span className="text-2xl font-black text-dark tracking-tighter uppercase">REHWAS</span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">
                Property management software <br /> 
                for the way India rents.
              </p>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © 2026 REHWAS Technologies Pvt. Ltd. <br /> Bengaluru, India
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 col-span-1 md:col-span-3 gap-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</h4>
                <div className="flex flex-col gap-4 text-sm font-bold text-dark">
                  <Link to="/pricing" className="hover:text-emerald-600 transition-colors">Pricing</Link>
                  <Link to="/features" className="hover:text-emerald-600 transition-colors">Features</Link>
                  <Link to="/api" className="hover:text-emerald-600 transition-colors">API</Link>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resources</h4>
                <div className="flex flex-col gap-4 text-sm font-bold text-dark">
                  <Link to="/blog" className="hover:text-emerald-600 transition-colors">Blog</Link>
                  <Link to="/help" className="hover:text-emerald-600 transition-colors">Help Center</Link>
                  <Link to="/security" className="hover:text-emerald-600 transition-colors">Security</Link>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal</h4>
                <div className="flex flex-col gap-4 text-sm font-bold text-dark">
                  <Link to="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
                  <Link to="/terms" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xs font-black text-slate-400 tracking-widest flex items-center gap-4">
               <Star size={14} className="text-amber-400" /> Rated 4.9/5 by Indian Renters
            </div>
            <div className="text-xs font-black text-slate-900 tracking-widest">
               BUILT WITH ❤️ FOR BHARAT 🇮🇳
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
