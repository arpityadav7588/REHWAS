import { useState } from 'react';
import { 
  Check, X, Lock, ShieldCheck, 
  Smartphone, IndianRupee, MessageCircle, 
  ChevronDown, ChevronUp
} from 'lucide-react';

/**
 * Pricing Page Component.
 * 
 * PRICING PSYCHOLOGY APPLIED:
 * 1. Center Stage Effect: The "Pro" plan is highlighted as the most popular choice to guide user behavior.
 * 2. Anchor Pricing: The "Business" plan serves as a high anchor, making the "Pro" plan seem like a bargain.
 * 3. Loss Aversion: Features locked in lower tiers (marked with 🔒) trigger a desire to upgrade to avoid "missing out" on utility.
 * 4. Benefit-Focused Framing: CTA buttons use action-oriented language (e.g., "Start Pro Free") to reduce friction.
 * 5. Trust Signals: FAQ and Badges reduce perceived risk and anxiety during the decision phase.
 * 6. Decoy Pricing: The Starter plan is functional but intentionally limited in convenience (e.g., no PDF receipts) to nudge active users to Pro.
 */
const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const plans = [
    {
      name: "Starter",
      id: "starter",
      priceMonthly: 0,
      priceAnnual: 0,
      subtitle: "For landlords just getting started",
      features: [
        { text: "Up to 3 room listings", included: true },
        { text: "Basic rent ledger", included: true },
        { text: "WhatsApp reminder links", included: true },
        { text: "In-app chat with tenants", included: true },
        { text: "Bhoomi Score for listings", included: true },
        { text: "Rent receipts PDF", included: false },
        { text: "Utility bill splitter", included: false },
        { text: "Digital Estate Dossier", included: false },
        { text: "P&L dashboard", included: false },
        { text: "Boosted listings", included: false },
      ],
      cta: "Get Started Free",
      popular: false,
      color: "slate"
    },
    {
      name: "Pro",
      id: "pro",
      priceMonthly: 299,
      priceAnnual: 249,
      subtitle: "For active landlords managing multiple properties",
      features: [
        { text: "Unlimited room listings", included: true },
        { text: "Full rent ledger + history", included: true },
        { text: "WhatsApp reminder links", included: true },
        { text: "In-app chat with tenants", included: true },
        { text: "Bhoomi Score for listings", included: true },
        { text: "Rent receipts PDF generator", included: true },
        { text: "Utility bill splitter (Urja)", included: true },
        { text: "Digital Estate Dossier", included: true },
        { text: "3 boosted listings/month", included: true },
        { text: "AI Rent Buddy (50 queries/mo)", included: true },
        { text: "P&L dashboard", included: false },
        { text: "Rent agreement e-sign", included: false },
      ],
      cta: "Start Pro Free — 14 days",
      popular: true,
      color: "emerald"
    },
    {
      name: "Business",
      id: "business",
      priceMonthly: 999,
      priceAnnual: 749,
      subtitle: "For PG owners and property managers",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "PG/Hostel management module", included: true },
        { text: "P&L dashboard + ITR export", included: true },
        { text: "Rent agreement e-sign", included: true },
        { text: "Unlimited boosted listings", included: true },
        { text: "AI Rent Buddy (unlimited)", included: true },
        { text: "Priority WhatsApp support", included: true },
        { text: "API access (coming soon)", included: true },
        { text: "Manage multi-landlord accounts", included: true },
      ],
      cta: "Start Business Free — 14 days",
      popular: false,
      color: "slate"
    }
  ];

  const faqs = [
    {
      q: "Can I change plans later?",
      a: "Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new features will be available immediately."
    },
    {
      q: "What happens when my 14-day trial ends?",
      a: "At the end of your trial, you'll be prompted to enter payment details to continue using Pro/Business features. If you choose not to, your account will automatically move to the Starter plan."
    },
    {
      q: "Is my data safe if I cancel?",
      a: "Absolutely. We maintain backups of all data. Even if you cancel your subscription, you'll still have access to your historical records on the Starter plan limits."
    },
    {
      q: "Do you support UPI for payments?",
      a: "Yes, we support all major Indian payment methods including UPI (GPay, PhonePe, Paytm), Credit/Debit cards, and Net Banking via Razorpay."
    },
    {
      q: "What is the Bhoomi Score?",
      a: "Bhoomi Score is our proprietary trust metric that evaluates listing quality, landlord responsiveness, and previous tenant feedback to help you stand out."
    }
  ];

  const comparisonFeatures = [
    { name: "Listings", starter: "Up to 3", pro: "Unlimited", business: "Unlimited" },
    { name: "Rent Ledger", starter: "Basic", pro: "Full + History", business: "Full + Analytics" },
    { name: "WhatsApp Reminders", starter: true, pro: true, business: true },
    { name: "Bhoomi Score", starter: true, pro: true, business: true },
    { name: "PDF Rent Receipts", starter: false, pro: true, business: true },
    { name: "Utility Splitter (Urja)", starter: false, pro: true, business: true },
    { name: "AI Rent Buddy", starter: false, pro: "50 queries", business: "Unlimited" },
    { name: "Boosted Listings", starter: false, pro: "3 / month", business: "Unlimited" },
    { name: "P&L Dashboard", starter: false, pro: false, business: true },
    { name: "PG/Hostel Module", starter: false, pro: false, business: true },
    { name: "ITR Export", starter: false, pro: false, business: true },
    { name: "Priority Support", starter: false, pro: false, business: "WhatsApp" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pt-20 pb-20">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4">
          Simple, <span className="text-emerald-600">Transparent</span> Pricing
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-medium">
          Whether you have one room or a hundred, REHWAS grows with you. No hidden fees, just pure management.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-8 bg-slate-200 rounded-full p-1 relative transition-colors hover:bg-slate-300"
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Annual</span>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
              SAVE 17%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full
              ${plan.popular ? 'border-2 border-emerald-500 shadow-xl ring-4 ring-emerald-50' : 'border border-slate-100 shadow-sm'}
              ${plan.popular ? 'bg-emerald-50/10' : ''}
            `}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-slate-500 text-sm font-medium">{plan.subtitle}</p>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-slate-900 text-4xl font-black italic">₹</span>
              <span className={`text-5xl font-black tracking-tighter ${isAnnual && plan.priceAnnual > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {isAnnual ? plan.priceAnnual : plan.priceMonthly}
              </span>
              <span className="text-slate-500 font-bold ml-1">/month</span>
            </div>

            {isAnnual && plan.priceAnnual > 0 && (
              <div className="mb-6 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider mb-1">Annual Billing</p>
                <div className="flex items-center gap-2">
                   <span className="text-sm text-slate-400 line-through font-bold">₹{plan.priceMonthly * 12}</span>
                   <span className="text-sm text-amber-600 font-black">₹{plan.priceAnnual * 12} /year</span>
                </div>
              </div>
            )}

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  {feature.included ? (
                    <div className="mt-0.5 p-0.5 bg-emerald-100 rounded-full">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="mt-0.5 p-0.5 bg-slate-100 rounded-full flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-400 stroke-[3]" />
                    </div>
                  )}
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            <button className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95
              ${plan.popular 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200' 
                : 'bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-900 hover:text-white'}
            `}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Secure Payments</p>
              <p className="text-xs text-slate-500 font-medium">via Razorpay Encryption</p>
            </div>
          </div>
          <div className="w-px h-12 bg-slate-100 hidden md:block" />
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Cancel Anytime</p>
              <p className="text-xs text-slate-500 font-medium">No lock-in contracts</p>
            </div>
          </div>
          <div className="w-px h-12 bg-slate-100 hidden md:block" />
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Made for India</p>
              <p className="text-xs text-slate-500 font-medium">Local pricing & support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 overflow-hidden">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Compare Features</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Everything you need to manage like a pro</p>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="p-6 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Feature</th>
                <th className="p-6 text-slate-900 font-black uppercase text-sm tracking-tight text-center">Starter</th>
                <th className="p-6 text-emerald-600 font-black uppercase text-sm tracking-tight text-center bg-emerald-50/30">Pro</th>
                <th className="p-6 text-slate-900 font-black uppercase text-sm tracking-tight text-center">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {comparisonFeatures.map((f, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6 text-slate-900 font-bold text-sm">{f.name}</td>
                  <td className="p-6 text-center">
                    {typeof f.starter === 'string' ? (
                      <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase">{f.starter}</span>
                    ) : f.starter ? (
                      <Check className="w-5 h-5 text-emerald-500 mx-auto stroke-[3]" />
                    ) : (
                      <X className="w-5 h-5 text-slate-200 mx-auto stroke-[2]" />
                    )}
                  </td>
                  <td className="p-6 text-center bg-emerald-50/10">
                    {typeof f.pro === 'string' ? (
                      <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase">{f.pro}</span>
                    ) : f.pro ? (
                      <Check className="w-5 h-5 text-emerald-500 mx-auto stroke-[3]" />
                    ) : (
                      <X className="w-5 h-5 text-slate-200 mx-auto stroke-[2]" />
                    )}
                  </td>
                  <td className="p-6 text-center">
                    {typeof f.business === 'string' ? (
                      <span className="text-xs font-black text-slate-900 bg-slate-200 px-3 py-1 rounded-full uppercase">{f.business}</span>
                    ) : f.business ? (
                      <Check className="w-5 h-5 text-emerald-500 mx-auto stroke-[3]" />
                    ) : (
                      <X className="w-5 h-5 text-slate-200 mx-auto stroke-[2]" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Questions?</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Everything you need to know</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button 
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between group"
              >
                <span className="font-black text-slate-900 text-sm md:text-base uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                  {faq.q}
                </span>
                {expandedFaq === idx ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {expandedFaq === idx && (
                <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2">
                  <p className="text-slate-600 font-medium text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-slate-900 rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Still have questions?</h3>
            <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">Our team is here to help you get started</p>
            <button className="flex items-center gap-2 mx-auto bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-sm">
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
