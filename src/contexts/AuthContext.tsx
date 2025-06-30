import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useDevMode } from './DevModeContext';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  resetPassword: (email: string) => Promise<void>;
  updateUserRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const shouldBlockUser = (user: any) => {
  const now = new Date();
  const trialEnd = new Date(user?.user_metadata?.trial_end_date);
  const isTrialExpired = user?.user_metadata?.subscription_status === 'trial' && trialEnd < now;
  const isOverdue = user?.user_metadata?.subscription_status === 'overdue';
  return isTrialExpired || isOverdue;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDevMode, fakeUser } = useDevMode();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isBlocked, setIsBlocked] = useState(false);

useEffect(() => {
  if (!isSupabaseConfigured || !supabase) {
    setLoading(false);
    return;
  }

  // Initial session check
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);

    // Block check
    if (session?.user && shouldBlockUser(session.user)) {
      setIsBlocked(true);
    }

    setLoading(false);
  });

  // Auth state listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user && shouldBlockUser(session.user)) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }

      setLoading(false);
    }
  );

  return () => subscription.unsubscribe();
}, [isDevMode, fakeUser]);


  const signIn = async (email: string, password: string) => {
    if (isDevMode) {
      setUser(fakeUser as User);
      setSession({ user: fakeUser } as Session);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (isDevMode) {
      setUser(fakeUser as User);
      setSession({ user: fakeUser } as Session);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialStart.getDate() + 14);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin',
          is_owner: true,
          trial_start_date: trialStart.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          is_trial_active: true,
          subscription_status: 'trial',
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isDevMode) return;

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    if (isDevMode) return;

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updateUserRole = async (role: string) => {
    if (!user) return;

    if (isDevMode) {
      const updatedUser = {
        ...fakeUser,
        user_metadata: {
          ...fakeUser.user_metadata,
          role: role
        }
      };
      setUser(updatedUser as User);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { role }
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
    resetPassword,
    updateUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
