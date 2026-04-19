import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isLandlord: boolean;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (identifier: string, token: string, type?: 'sms' | 'email') => Promise<{ error: Error | null; profile: Profile | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider component.
 * WHAT IT DOES: Wraps the application to provide global access to user session, profile data, and auth functions.
 * ANALOGY: The security desk at the entrance of a building that knows who is inside, what floor they can go to, and hands out visitor badges.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper to fetch user's profile from the database
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setProfile(data);
      return data;
    }
    return null;
  };

  useEffect(() => {
    // Check for existing session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (e.g. login, logout, token refresh)
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
   * Initiates login with phone number via OTP.
   * WHAT IT DOES: Sends an SMS code to the provided number using Supabase Auth.
   * ANALOGY: Ringing a doorbell to get a one-time secret passkey slipped under the door.
   */
  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  };

  /**
   * Initiates login with email via OTP (Magic Link/Code).
   * WHAT IT DOES: Sends an email code to the provided address using Supabase Auth.
   * ANALOGY: Sending a digital invitation key to your inbox instead of ringing the bell.
   */
  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  };

  /**
   * Verifies the OTP sent via email or phone.
   * WHAT IT DOES: Submits the token to Supabase, logs the user in if correct, and fetches their profile.
   * ANALOGY: Showing the secret passkey to the bouncer to get inside the club.
   */
  const verifyOtp = async (identifier: string, token: string, type: 'sms' | 'email' | 'magiclink' = 'sms') => {
    const params: any = { token, type };
    if (type === 'sms') params.phone = identifier;
    else params.email = identifier;

    const { data, error } = await supabase.auth.verifyOtp(params);
    
    if (error) return { error, profile: null };
    
    if (data.user) {
      // Small delay to ensure the database trigger (handle_new_user) finishes inserting the profile
      await new Promise(resolve => setTimeout(resolve, 500));
      const p = await fetchProfile(data.user.id);
      return { error: null, profile: p };
    }
    return { error: null, profile: null };
  };

  /**
   * Refreshes the local profile data from Supabase.
   */
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  /**
   * Logs the user out.
   * WHAT IT DOES: Clears the Supabase session, resets local state, and redirects to the home page.
   * ANALOGY: Handing back your visitor badge and walking out the front door.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  /**
   * Updates the current user's profile.
   * WHAT IT DOES: Sends new profile data (like name or role) to the 'profiles' table.
   * ANALOGY: Updating your details on your employee ID card.
   */
  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not logged in') };
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
      
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...data } : null);
    }
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isLandlord: profile?.role === 'landlord',
      signInWithPhone,
      signInWithEmail,
      verifyOtp,
      signOut,
      updateProfile,
      refreshProfile
    }}>

      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth state and methods.
 * WHAT IT DOES: Provides an easy way for any component to get user data or trigger auth flows.
 * ANALOGY: A walkie-talkie that instantly connects you to the security desk.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
