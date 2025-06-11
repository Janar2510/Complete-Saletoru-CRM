import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useDevMode } from './DevModeContext';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDevMode, fakeUser } = useDevMode();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDevMode) {
      // In dev mode, use fake user
      setUser(fakeUser as User);
      setSession({ user: fakeUser } as Session);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [isDevMode, fakeUser]);

  const signIn = async (email: string, password: string) => {
    if (isDevMode) {
      // In dev mode, just pretend to sign in
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
      // In dev mode, just pretend to sign up
      setUser(fakeUser as User);
      setSession({ user: fakeUser } as Session);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'user', // Default role
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isDevMode) {
      // In dev mode, just pretend to sign out
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    if (isDevMode) {
      // In dev mode, just pretend to reset password
      return;
    }

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
      // In dev mode, just update the fake user
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