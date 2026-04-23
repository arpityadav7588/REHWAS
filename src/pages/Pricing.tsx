import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Zap, 
  Shield, 
  Users, 
  Globe, 
  MessageCircle, 
  Plus, 
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Layout,
  FileText,
  CreditCard,
  Target,
  Sparkles,
  Smartphone,
  Mail,
  HeadphonesIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

/**
 * PRICING PSYCHOLOGY: ANCHORING & THE CENTER-STAGE EFFECT
 * 
 * 1. DEFAULT TO ANNUAL: By defaulting to annual billing, we capitalize on the "Incentive Bias." 
 *    The large "Save ₹989" badges act as positive reinforcement, making the higher upfront 
 *    commitment feel like a victory for the customer.
 * 
 * 2. PRO AS THE ANCHOR: The Pro plan is visually emphasized (larger, green border) to trigger 
 *    the "Center-Stage Effect." Humans naturally perceive middle options as the safest and 
 *    most balanced choice.
 * 
 * 3. STARTER AS THE DECOY: The Starter plan exists to reduce "Analysis Paralysis." It provides 
 *    a low-friction entry point (Foot-in-the-door technique) to get users into the ecosystem.
 * 
 * 4. BUSINESS AS THE CEILING: The Business plan anchors the price high, making the Pro plan 
 *    look significantly more affordable by comparison (Relative Value Perception).
 */

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribe } = useSubscription();

  const handlePlanAction = (planName: string) => {
    if (!user) {
      navigate(planName === 'Starter' ? '/login' : '/login?plan=' + planName.toLowerCase());
      return;
    }

    if (planName === 'Starter') {
      navigate('/dashboard');
      return;
    }

    subscribe(planName.toLowerCase() as 'pro' | 'business', isAnnual ? 'annual' : 'monthly');
  };

  // Pricing Data
  const plans = [
    {
      name: "Starter",
      subtitle: "For landlords just getting started",
      price: "0",
      priceLabel: "/month",
      description: "Free forever",
      cta: "Get started free",
      ctaVariant: "outline",
      features: [
        { text: "Up to 3 rooms", included: true },
        { text: "Rent ledger (6 months history)", included: true },
        { text: "WhatsApp reminders", included: true },
        { text: "Basic room listing on map", included: true },
        { text: "In-app tenant chat", included: true },
        { text: "5 photos per listing", included: true },
        { text: "AI 3D room preview", included: false },
        { text: "Rent receipt generator", included: false },
        { text: "P&L dashboard", included: false },
        { text: "Rent agreements", included: false },
      ]
    },
    {
      name: "Pro",
      subtitle: "For serious landlords",
      price: isAnnual ? "4,999" : "499",
      priceLabel: isAnnual ? "/year" : "/month",
      oldPrice: isAnnual ? "5,988" : null,
      saveBadge: isAnnual ? "SAVE ₹989" : null,
      description: "Everything in Starter, plus more",
      cta: "Start 14-day free trial",
      ctaVariant: "solid",
      popular: true,
      features: [
        { text: "Everything in Starter", included: true },
        { text: "Up to 15 rooms", included: true },
        { text: "Full ledger + Urja splitter", included: true },
        { text: "Unlimited history", included: true },
        { text: "20 photos per listing", included: true },
        { text: "5 AI 3D previews per month", included: true },
        { text: "Rent receipt generator", included: true },
        { text: "P&L dashboard + ITR export", included: true },
        { text: "Move-in Photo Reports", included: true },
        { text: "Priority email support", included: true },
      ]
    },
    {
      name: "Business",
      subtitle: "For property managers",
      price: isAnnual ? "14,999" : "1,499",
      priceLabel: isAnnual ? "/year" : "/month",
      oldPrice: isAnnual ? "17,988" : null,
      saveBadge: isAnnual ? "SAVE ₹2,989" : null,
      description: "For professional operations",
      cta: "Start 14-day free trial",
      ctaVariant: "outline-dark",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Unlimited rooms", included: true },
        { text: "Unlimited AI 3D previews", included: true },
        { text: "Rent agreement generator + e-sign", included: true },
        { text: "3 team member seats", included: true },
        { text: "API access for integrations", included: true },
        { text: "White-label your portal", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Custom onboarding call", included: true },
      ]
    }
  ];

  const addOns = [
    {
      title: "AI 3D Preview Credits",
      price: "₹49",
      label: "per room",
      desc: "For Starter users who want occasional 3D",
      icon: <Sparkles className="text-amber-500" size={24} />
    },
    {
      title: "Rent Agreement",
      price: "₹299",
      label: "each",
      desc: "Legally valid e-sign via Aadhaar",
      icon: <FileText className="text-blue-500" size={24} />
    },
    {
      title: "Extra Team Seat",
      price: "₹299",
      label: "/seat/month",
      desc: "Add more co-owners or managers",
      icon: <Users className="text-purple-500" size={24} />
    },
    {
      title: "White-label Domain",
      price: "₹999",
      label: "/month",
      desc: "yourname.rehwas.in custom branding",
      icon: <Globe className="text-emerald-500" size={24} />
    }
  ];

  const faqs = [
    {
      q: "Can I cancel anytime?",
      a: "Yes. Cancel from Settings → Billing anytime. No questions asked. Your data is kept for 30 days."
    },
    {
      q: "What happens when I hit my room limit on Starter?",
      a: "You'll see a prompt to upgrade. Existing rooms remain active, but you can't add new ones until you upgrade."
    },
    {
      q: "Is there a free trial for Pro/Business?",
      a: "Yes — 14 days free, no credit card required. After 14 days, you're automatically moved to Starter unless you add payment."
    },
    {
      q: "Can I get a refund?",
      a: "We offer a full refund within 7 days of any charge, no questions asked."
    },
    {
      q: "Do you charge tenants?",
      a: "Never. Tenants use REHWAS completely free — finding rooms, chatting with landlords, booking visits. We only charge landlords for the management tools."
    },
    {
      q: "What payment methods do you accept?",
      a: "UPI, all major Indian debit/credit cards, net banking via Razorpay."
    }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-['Inter',sans-serif] text-slate-900 pb-20">
      {/* Header Section */}
      <div className="pt-24 pb-16 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          Fair pricing for <span className="text-emerald-600">every landlord.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12">
          From a single room to a massive portfolio, we have the tools you need to manage with confidence.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`text-sm font-bold transition-colors ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-7 bg-slate-200 rounded-full relative p-1 transition-colors hover:bg-slate-300"
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold transition-colors ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Annual</span>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Save 2 months
            </span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch px-4">
          {plans.map((plan, idx) => (
            <div 
              key={idx}
              className={`relative bg-white rounded-[2rem] p-8 md:p-10 flex flex-col transition-all duration-300 ${
                plan.popular 
                ? 'border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 md:scale-105 z-10' 
                : 'border border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{plan.description}</span>
                </div>
                <p className="text-slate-500 text-sm font-medium">{plan.subtitle}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">₹</span>
                  <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-slate-400 font-bold ml-1">{plan.priceLabel}</span>
                </div>
                {plan.oldPrice && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-slate-400 line-through text-sm font-bold">₹{plan.oldPrice}/year</span>
                    {plan.saveBadge && (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100">
                        {plan.saveBadge}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={() => handlePlanAction(plan.name)}
                className={`w-full py-4 rounded-xl font-bold text-center transition-all active:scale-95 mb-4 ${
                  plan.ctaVariant === 'solid' 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20' 
                  : plan.ctaVariant === 'outline-dark'
                  ? 'border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                  : 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {plan.cta}
              </button>
              
              {plan.ctaVariant === 'solid' && (
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                  No credit card required
                </p>
              )}

              <div className="space-y-4 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <Check className="text-emerald-600" size={12} strokeWidth={4} />
                      </div>
                    ) : (
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                        <X className="text-slate-300" size={12} strokeWidth={3} />
                      </div>
                    )}
                    <span className={`text-sm ${feature.included ? 'text-slate-700 font-medium' : 'text-slate-400 font-medium'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Pay only for what you need</h2>
          <p className="text-slate-500 font-medium">Add these to any plan</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {addOns.map((addon, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">{addon.icon}</div>
              <h3 className="font-bold text-slate-900 mb-1">{addon.title}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-black">{addon.price}</span>
                <span className="text-xs text-slate-400 font-medium">{addon.label}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{addon.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full mb-4">
            <HelpCircle size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Common Questions</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Everything you need to know</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                expandedFaq === idx ? 'border-emerald-200 shadow-lg shadow-emerald-500/5' : 'border-slate-100'
              }`}
            >
              <button 
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className={`font-bold transition-colors ${expandedFaq === idx ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {faq.q}
                </span>
                <ChevronDown 
                  className={`text-slate-400 transition-transform duration-200 ${expandedFaq === idx ? 'rotate-180 text-emerald-600' : ''}`} 
                  size={20} 
                />
              </button>
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  expandedFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 text-slate-500 font-medium text-sm leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden group">
          {/* Subtle patterns/glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-1000" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -ml-48 -mb-48 transition-transform group-hover:scale-110 duration-1000" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Still not sure? Talk to us.</h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10">
              Book a free 15-minute demo call with our team. We'll show you exactly how REHWAS can save you 10+ hours of management every week.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-10 py-4 rounded-xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest">
                Schedule a Demo
              </button>
              <button className="flex items-center gap-2 text-white font-bold hover:text-emerald-400 transition-colors">
                <MessageCircle size={20} />
                <span>Chat with an expert</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Trust Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-12 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale contrast-125">
        <div className="flex items-center gap-2 font-black text-xl">
          <Shield size={24} /> SECURE
        </div>
        <div className="flex items-center gap-2 font-black text-xl italic uppercase tracking-tighter">
          <CreditCard size={24} /> Razorpay
        </div>
        <div className="flex items-center gap-2 font-black text-xl">
          <Layout size={24} /> SAAS
        </div>
        <div className="flex items-center gap-2 font-black text-xl">
          <Target size={24} /> PRECISION
        </div>
      </div>
    </div>
  );
};

export default Pricing;
