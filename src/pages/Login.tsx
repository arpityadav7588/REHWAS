import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * The Login page component.
 * WHAT IT DOES: Handles user authentication using phone OTP and provides a new user onboarding flow.
 * ANALOGY: The front reception desk where visitors provide their number, get verified, and state their business before entering.
 */
export default function Login() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Phone, 2: OTP, 3: Onboarding
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { signInWithPhone, verifyOtp, updateProfile } = useAuth();
  const navigate = useNavigate();

  /**
   * Starts a 30-second countdown timer for resending OTP.
   * WHAT IT DOES: Prevents users from spamming the "Resend OTP" button.
   * ANALOGY: A cooling down period for a machine before you can press the power button again.
   */
  const startCountdown = () => {
    setCountdown(30);
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

  /**
   * Handles sending the initial OTP.
   * WHAT IT DOES: Validates the phone number format and calls the auth hook to send the SMS.
   * ANALOGY: Handing your phone to the receptionist to send you a verification text.
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setLoading(true);
    const { error } = await signInWithPhone(`+91${phone}`);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      setStep(2);
      startCountdown();
      toast.success('OTP sent successfully');
    }
  };

  /**
   * Handles verifying the user's OTP.
   * WHAT IT DOES: Validates the 6-digit code and checks if the user needs onboarding or can be redirected.
   * ANALOGY: Handing the secret code back to the receptionist to get your entry pass.
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    const { error, profile } = await verifyOtp(`+91${phone}`, otp);
    setLoading(false);
    
    if (error) {
      toast.error('Invalid OTP. Please try again.');
    } else {
      toast.success('Logged in successfully!');
      // Check if user is complete
      if (profile && !profile.full_name) {
        setStep(3); // Go to onboarding
      } else if (profile?.role === 'landlord') {
        navigate('/dashboard');
      } else {
        navigate('/discover');
      }
    }
  };

  /**
   * Handles the onboarding form submission for new users.
   * WHAT IT DOES: Saves the user's name and role, then redirects them to the appropriate dashboard.
   * ANALOGY: Filling out your name and bringing your ID card to life on your first visit.
   */
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
    <div className="min-h-screen flex flex-col md:flex-row bg-surface font-sans">
      {/* Left Side - Branding (Hidden on Mobile) */}
      <div className="md:w-1/2 bg-brand text-white p-8 md:p-12 flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <Building2 className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">REHWAS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mt-16">
            Find your perfect<br />space today.
          </h2>
          <p className="mt-6 text-lg text-emerald-100 max-w-md">
            The easiest way to discover, rent, and manage rooms, PGs, and apartments across India.
          </p>
        </div>
        <div className="text-emerald-200 text-sm">
          © {new Date().getFullYear()} REHWAS Technologies
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-10 text-brand">
            <Building2 className="w-7 h-7" />
            <span className="text-2xl font-bold tracking-tight">REHWAS</span>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-bold text-dark">Welcome back</h2>
                <p className="text-slate-500 mt-2">Enter your phone number to continue</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center gap-2 text-slate-600 pointer-events-none">
                    <span className="text-lg">🇮🇳</span>
                    <span className="font-medium">+91</span>
                    <div className="h-5 w-px bg-slate-300 ml-1"></div>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-[5.5rem] pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all text-dark font-medium placeholder-slate-400"
                    placeholder="98765 43210"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full bg-brand hover:bg-emerald-600 text-white font-semibold flex py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed justify-center items-center gap-2 shadow-sm hover:shadow active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-bold text-dark">Verify OTP</h2>
                <p className="text-slate-500 mt-2">Sent securely to +91 {phone}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">One Time Password</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all text-center tracking-[0.5em] text-xl font-bold text-dark"
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-brand hover:bg-emerald-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm hover:shadow active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || loading}
                  className="text-sm font-medium text-brand hover:text-emerald-700 disabled:text-slate-400 transition-colors"
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleOnboarding} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-dark">Complete your profile</h2>
                <p className="text-slate-500 mt-2">Just a few details before you dive in.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">What's your full name?</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all text-dark placeholder-slate-400 font-medium"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">I am looking to...</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('tenant')}
                      className={`relative py-4 px-4 rounded-xl font-semibold border-2 transition-all flex flex-col items-center gap-2 ${
                        role === 'tenant' 
                          ? 'border-brand bg-emerald-50 text-brand shadow-sm scale-[1.02]' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>Rent a Room</span>
                      {role === 'tenant' && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-brand rounded-full border-2 border-white"></div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('landlord')}
                      className={`relative py-4 px-4 rounded-xl font-semibold border-2 transition-all flex flex-col items-center gap-2 ${
                        role === 'landlord' 
                          ? 'border-brand bg-emerald-50 text-brand shadow-sm scale-[1.02]' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>List a Property</span>
                      {role === 'landlord' && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-brand rounded-full border-2 border-white"></div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-brand hover:bg-emerald-600 text-white font-semibold py-4 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow hover:shadow-md active:scale-[0.98] mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Continue to Dashboard <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
