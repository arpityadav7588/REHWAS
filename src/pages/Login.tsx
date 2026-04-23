import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Loader2, Home, LayoutDashboard, ShieldCheck, Mail, Search } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * The Login page component.
 * WHAT IT DOES: Handles user authentication using email OTP and provides a dual-entry role-based onboarding.
 * ANALOGY: A grand entrance with two distinct paths—one leads to the showroom (Tenant) and the other to the management office (Landlord).
 */
export default function Login() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0: Role Selection, 1: Contact, 2: OTP, 3: Onboarding
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { user, profile, signInWithEmail, signInWithPhone, verifyOtp, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile?.full_name) {
      if (profile.role === 'landlord') {
        navigate('/dashboard');
      } else {
        navigate('/discover');
      }
    }
  }, [user, profile, navigate]);

  // Animation effect on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'email') {
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      setLoading(true);
      const { error } = await signInWithEmail(email);
      setLoading(false);
      
      if (error) {
        toast.error(error.message);
      } else {
        setStep(2);
        startCountdown();
        toast.success('Verification code sent to your email');
      }
    } else {
      if (!phone || phone.length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }
      
      setLoading(true);
      const { error } = await signInWithPhone(phone.startsWith('+') ? phone : `+91${phone}`);
      setLoading(false);
      
      if (error) {
        toast.error(error.message);
      } else {
        setStep(2);
        startCountdown();
        toast.success('Verification code sent to your phone');
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    
    setLoading(true);
    const { error, profile } = await verifyOtp(method === 'email' ? email : (phone.startsWith('+') ? phone : `+91${phone}`), otp, method === 'email' ? 'email' : 'sms');
    setLoading(false);
    
    if (error) {
      toast.error('Invalid code. Please try again.');
    } else {
      toast.success('Logged in successfully!');
      // If no profile exists yet (new user) or name is missing, go to onboarding
      if (!profile || !profile.full_name) {
        setStep(3);
      } else if (profile.role === 'landlord') {
        navigate('/dashboard');
      } else {
        navigate('/discover');
      }
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    setLoading(true);
    const { error } = await updateProfile({ full_name: name, role });
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile setup complete!');
      if (role === 'landlord') {
        navigate('/dashboard');
      } else {
        navigate('/discover');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface font-sans selection:bg-brand/20">
      {/* Left Decoration - Branding (Hidden on Mobile) */}
      <div className="md:w-5/12 bg-brand text-white p-12 flex flex-col justify-between hidden md:flex relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16 cursor-pointer" onClick={() => navigate('/')}>
            <Building2 className="w-8 h-8" />
            <span className="text-2xl font-black tracking-tight">REHWAS</span>
          </div>
          
          <div className="space-y-6">
             <h2 className="text-5xl font-black leading-none tracking-tighter">
                Making Bharat's<br />Rentals Better.
             </h2>
             <p className="text-xl text-emerald-100/80 leading-relaxed font-medium">
                The most transparent platform to discover and manage premium urban living spaces.
             </p>
          </div>
        </div>

        <div className="relative z-10">
           <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                 <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white leading-tight">Join 10,000+ verified tenants and landlords today.</p>
           </div>
           <p className="mt-8 text-emerald-200/50 text-[10px] font-black uppercase tracking-widest">
              © {new Date().getFullYear()} REHWAS Technologies. Built for Bharath 🇮🇳
           </p>
        </div>
      </div>

      {/* Right Interaction Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 min-h-screen">
        <div className="w-full max-w-lg bg-white sm:p-10 p-4 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-slate-50 transition-all">
          
          {/* Progress Header (for Login Steps) */}
          {step > 0 && (
            <div className="flex items-center justify-between mb-10">
               <button 
                 onClick={() => setStep(prev => (prev - 1) as any)}
                 className="flex items-center gap-2 text-slate-400 font-bold text-xs hover:text-brand transition-colors uppercase tracking-widest"
               >
                 Go Back
               </button>
               <div className="flex gap-1.5">
                  <div className={`h-1.5 w-8 rounded-full transition-all ${step >= 1 ? 'bg-brand shadow-sm shadow-brand/20' : 'bg-slate-100'}`}></div>
                  <div className={`h-1.5 w-8 rounded-full transition-all ${step >= 2 ? 'bg-brand shadow-sm shadow-brand/20' : 'bg-slate-100'}`}></div>
               </div>
            </div>
          )}

          {/* STEP 0: Role Selection */}
          {step === 0 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center">
                  <h1 className="text-3xl font-black text-dark mb-3 tracking-tight">How can we help you?</h1>
                  <p className="text-slate-400 font-medium">Pick a path and let's get you settled.</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button 
                    onClick={() => { setRole('tenant'); setStep(1); }}
                    className="group relative flex flex-col items-center justify-center p-8 bg-surface border-2 border-slate-50 rounded-[2.5rem] hover:border-brand/40 hover:bg-emerald-50/30 transition-all text-center"
                  >
                     <div className="w-20 h-20 bg-white shadow-sm group-hover:shadow-md rounded-[2.2rem] flex items-center justify-center mb-6 border border-slate-100 transition-all rotate-3 group-hover:rotate-0">
                        <Search className="w-10 h-10 text-brand" />
                     </div>
                     <span className="font-black text-dark text-lg mb-2">Find a Home</span>
                     <p className="text-slate-400 text-xs font-semibold leading-relaxed">Search rooms & PGs with zero brokerage.</p>
                     <div className="mt-6 w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                     </div>
                  </button>

                  <button 
                    onClick={() => { setRole('landlord'); setStep(1); }}
                    className="group relative flex flex-col items-center justify-center p-8 bg-surface border-2 border-slate-50 rounded-[2.5rem] hover:border-blue-200 hover:bg-blue-50/30 transition-all text-center"
                  >
                     <div className="w-20 h-20 bg-white shadow-sm group-hover:shadow-md rounded-[2.2rem] flex items-center justify-center mb-6 border border-slate-100 transition-all -rotate-3 group-hover:rotate-0">
                        <LayoutDashboard className="w-10 h-10 text-blue-600" />
                     </div>
                     <span className="font-black text-dark text-lg mb-2">List Property</span>
                     <p className="text-slate-400 text-xs font-semibold leading-relaxed">Find verified tenants and manage rent.</p>
                     <div className="mt-6 w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                     </div>
                  </button>
               </div>

               <div className="pt-4 text-center">
                  <p className="text-slate-400 text-sm font-medium">Already have an account? <span onClick={() => setStep(1)} className="text-brand font-bold cursor-pointer hover:underline underline-offset-4">Log in here</span></p>
               </div>
            </div>
          )}

          {/* STEP 1: Contact Method */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
              <div>
                <h2 className="text-3xl font-black text-dark tracking-tighter">Your Account</h2>
                <p className="text-slate-500 mt-2 font-medium">Choose how you want to log in.</p>
              </div>

              {/* Method Toggle */}
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all ${method === 'email' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('phone')}
                  className={`flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all ${method === 'phone' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Phone
                </button>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  {method === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-5 flex items-center text-slate-400 pointer-events-none">
                    {method === 'email' ? <Mail className="w-5 h-5" /> : <div className="font-black text-sm text-slate-400">+91</div>}
                  </div>
                  {method === 'email' ? (
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-surface border-2 border-slate-50 rounded-[1.5rem] focus:ring-4 focus:ring-brand/5 focus:border-brand focus:bg-white outline-none transition-all text-dark font-black text-lg placeholder-slate-300"
                      placeholder="name@example.com"
                    />
                  ) : (
                    <input
                      type="tel"
                      required
                      autoFocus
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-16 pr-6 py-5 bg-surface border-2 border-slate-50 rounded-[1.5rem] focus:ring-4 focus:ring-brand/5 focus:border-brand focus:bg-white outline-none transition-all text-dark font-black text-lg placeholder-slate-300"
                      placeholder="98765 43210"
                    />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (method === 'email' ? !email.includes('@') : phone.length < 10)}
                className="w-full bg-brand text-white font-black py-5 px-6 rounded-[1.5rem] transition-all disabled:opacity-30 disabled:grayscale flex justify-center items-center gap-3 shadow-xl shadow-brand/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send Login Code <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          {/* STEP 2: Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
              <div>
                <h2 className="text-3xl font-black text-dark tracking-tighter">Check your {method === 'email' ? 'Inbox' : 'Phone'}</h2>
                <p className="text-slate-500 mt-2 font-medium">We've sent a 6-digit code to {method === 'email' ? email : phone}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-6 py-6 bg-surface border-2 border-slate-50 rounded-[1.5rem] focus:ring-4 focus:ring-brand/5 focus:border-brand focus:bg-white outline-none transition-all text-center tracking-[0.5em] text-3xl font-black text-dark placeholder-slate-100"
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-brand text-white font-black py-5 px-6 rounded-[1.5rem] transition-all disabled:opacity-30 flex justify-center items-center gap-3 shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || loading}
                  className="text-sm font-black text-brand hover:text-emerald-700 disabled:text-slate-300 transition-colors uppercase tracking-widest"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : `Resend ${method === 'email' ? 'Email' : 'SMS'}`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Onboarding */}
          {step === 3 && (
            <form onSubmit={handleOnboarding} className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-600">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <Home size={32} />
                </div>
                <h2 className="text-3xl font-black text-dark tracking-tight">The Final Detail</h2>
                <p className="text-slate-500 mt-2 font-medium">Welcome to the family. What should we call you?</p>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      autoFocus
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-6 py-5 bg-surface border-2 border-slate-50 rounded-[1.5rem] focus:ring-4 focus:ring-brand/10 focus:border-brand focus:bg-white outline-none transition-all text-dark font-black text-xl placeholder-slate-200"
                      placeholder="e.g. Rahul Sharma"
                    />
                 </div>
                 
                 <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-4 items-center">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                       {role === 'tenant' ? <div className="text-lg">🏡</div> : <div className="text-lg">🔑</div>}
                    </div>
                    <div>
                       <p className="text-xs font-black text-brand uppercase tracking-tighter">Your Role</p>
                       <p className="text-sm font-bold text-dark">{role === 'tenant' ? 'I am looking to rent a room' : 'I am a property owner/manager'}</p>
                    </div>
                    <button type="button" onClick={() => setStep(0)} className="ml-auto text-[10px] font-black text-slate-400 hover:text-brand transition-colors uppercase">Change</button>
                 </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-brand text-white font-black py-5 px-6 rounded-[1.5rem] transition-all disabled:opacity-30 shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-3"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Access My Estate <ArrowRight size={20} /></>}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

