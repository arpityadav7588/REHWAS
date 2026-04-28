import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isLandlord: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile: Profile | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  // Feature Gate helpers
  plan: 'starter' | 'pro' | 'business';
  isOnTrial: boolean;
  trialDaysLeft: number;
  hasPlan: (requiredPlan: 'starter' | 'pro' | 'business') => boolean;
  // Legacy OTP methods kept for backwards compatibility
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (identifier: string, token: string, type?: 'sms' | 'email') => Promise<{ error: Error | null; profile: Profile | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet, return null so Login.tsx triggers onboarding
          return null;
        }
        throw error;
      }
      
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // ─── DEMO SESSION CONSTANTS ───────────────────────────────────────────────
  const DEMO_TENANT_PROFILE: Profile = {
    id: 'demo-tenant-id',
    full_name: 'Demo Tenant',
    role: 'tenant',
    plan: 'pro',
    phone: null,
    avatar_url: null,
    kyc_status: 'verified',
    kyc_verified: true,
    trial_ends_at: null,
    onboarding_completed_steps: ['profile', 'room'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Profile;

  const DEMO_LANDLORD_PROFILE: Profile = {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Demo Landlord',
    role: 'landlord',
    plan: 'pro',
    phone: null,
    avatar_url: null,
    kyc_status: 'verified',
    kyc_verified: true,
    trial_ends_at: null,
    onboarding_completed_steps: ['profile', 'room'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Profile;
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Restore demo session from localStorage first (no Supabase call needed)
    const demoSession = localStorage.getItem('rehwas_demo_profile');
    if (demoSession) {
      try {
        const p = JSON.parse(demoSession) as Profile;
        setProfile(p);
        setUser({ id: p.id, email: p.role === 'tenant' ? 'tenant@rehwas.com' : 'landlord@rehwas.com' } as any);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('rehwas_demo_profile');
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign up with email + password. Does NOT require email confirmation.
   * New users are sent to the onboarding step to set name + role.
   */
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Skip email confirmation — user is logged in immediately
        emailRedirectTo: undefined,
      },
    });
    return { error };
  };

  /**
   * Sign in with email + password. Works instantly, no email needed.
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error, profile: null };
    if (data.user) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const p = await fetchProfile(data.user.id);
      return { error: null, profile: p };
    }
    return { error: null, profile: null };
  };

  const signOut = async () => {
    // Clear demo session if active
    localStorage.removeItem('rehwas_demo_profile');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    queryClient.clear();
    navigate('/');
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not logged in') };
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...data,
        updated_at: new Date().toISOString()
      });
    if (!error) {
      await fetchProfile(user.id);
    }
    return { error };
  };

  // --- Legacy OTP methods (kept so existing code doesn't break) ---
  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  };
  const signInWithEmail = async (email: string) => {
    // Demo Mode: skip email entirely — the OTP step will handle the bypass
    if (['test@rehwas.com', 'tenant@rehwas.com', 'landlord@rehwas.com'].includes(email)) {
      return { error: null };
    }
    
    const { error } = await supabase.auth.signInWithOtp({ email });
    
    // Surface a friendlier error if SMTP is misconfigured
    if (error?.message?.includes('sending confirmation email') || error?.message?.includes('sending email')) {
      return {
        error: Object.assign(new Error(
          'Email delivery is currently unavailable. Please use Phone login instead, or contact support.'
        ), { status: 503 })
      };
    }
    
    return { error };
  };

  const verifyOtp = async (identifier: string, token: string, type: 'sms' | 'email' | 'magiclink' = 'sms') => {
    // ─── DEMO MODE BYPASS (100% local — zero Supabase calls) ────────────────────
    // Uses tenant@rehwas.com or landlord@rehwas.com + token 123456.
    // Session is stored in localStorage so it survives page reloads.
    // This completely sidesteps broken Supabase Auth triggers.
    if (['test@rehwas.com', 'tenant@rehwas.com', 'landlord@rehwas.com'].includes(identifier) && token === '123456') {
      console.log('🧪 Demo Mode: local bypass activated for', identifier);

      const demoProfile = identifier === 'tenant@rehwas.com'
        ? DEMO_TENANT_PROFILE
        : DEMO_LANDLORD_PROFILE;

      const demoUser = {
        id: demoProfile.id,
        email: identifier,
        app_metadata: {},
        user_metadata: { full_name: demoProfile.full_name, role: demoProfile.role },
        aud: 'authenticated',
        created_at: demoProfile.created_at,
      } as unknown as import('@supabase/supabase-js').User;

      // Persist to localStorage so the session survives a page refresh
      localStorage.setItem('rehwas_demo_profile', JSON.stringify(demoProfile));

      // Update React state immediately
      setUser(demoUser);
      setProfile(demoProfile);

      toast.success(`Welcome, ${demoProfile.full_name}! 🎉`, { duration: 3000 });
      return { error: null, profile: demoProfile };
    }
    // ─── END DEMO MODE ──────────────────────────────────────────────────────────

    const params: any = { token, type };
    if (type === 'sms') params.phone = identifier;
    else params.email = identifier;
    
    const { data, error } = await supabase.auth.verifyOtp(params);
    if (error) return { error, profile: null };
    if (data.user) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const p = await fetchProfile(data.user.id);
      return { error: null, profile: p };
    }
    return { error: null, profile: null };
  };

  const plan = profile?.plan || 'starter';
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const isOnTrial = trialEndsAt ? trialEndsAt > new Date() : false;
  const trialDaysLeft = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hasPlan = (requiredPlan: 'starter' | 'pro' | 'business') => {
    const weights = { starter: 0, pro: 1, business: 2 };
    return weights[plan] >= weights[requiredPlan];
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isLandlord: profile?.role === 'landlord',
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
      plan,
      isOnTrial,
      trialDaysLeft,
      hasPlan,
      signInWithPhone,
      signInWithEmail,
      verifyOtp,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
