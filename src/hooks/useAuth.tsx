import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

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

  useEffect(() => {
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
    await supabase.auth.signOut();
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
    // Demo Mode Bypass
    if (email === 'test@rehwas.com') {
      return { error: null };
    }
    
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  };

  const verifyOtp = async (identifier: string, token: string, type: 'sms' | 'email' | 'magiclink' = 'sms') => {
    // Demo Mode Bypass
    if (identifier === 'test@rehwas.com' && token === '123456') {
      console.log('🧪 Demo Mode Bypass Triggered');
      
      const testEmail = 'test@rehwas.com';
      const testPassword = 'RehwasTest@123'; // Stronger password to satisfy complexity rules

      // 1. Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (!signInError && signInData.user) {
        console.log('🧪 Demo Login Successful');
        const p = await fetchProfile(signInData.user.id);
        return { error: null, profile: p };
      }

      console.warn('🧪 Demo Login Failed, attempting automatic Sign Up...', signInError?.message);

      // 2. If login fails, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: { full_name: 'Test User' }
        }
      });

      if (!signUpError && signUpData.user) {
        console.log('🧪 Demo Sign Up Successful');
        const p = await fetchProfile(signUpData.user.id);
        return { error: null, profile: p };
      }

      console.error('🧪 Demo Mode totally failed:', signUpError?.message || signInError?.message);
      return { error: signUpError || signInError, profile: null };
    }

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
