
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, studentCategory: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id ? 'User found' : 'No user');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // If user signs in, just update lastloginat since trigger handles user creation
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              // Update lastloginat on SIGNED_IN event
              const { error: updateError } = await supabase
                .from('users')
                .update({ lastloginat: new Date().toISOString() })
                .eq('userid', session.user.id);

              if (updateError) {
                console.error('Error updating lastloginat:', updateError);
              }
            } catch (error) {
              console.error('Error updating lastloginat:', error);
            }
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Check if this is a first-time login by checking if user has completed profile
    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('displayname, studentcategory')
        .eq('userid', data.user.id)
        .single();
      
      if (!userError && userData) {
        // Mark as first-time login if profile is incomplete
        const isFirstTimeLogin = !userData.displayname || !userData.studentcategory;
        return { ...data, isFirstTimeLogin };
      }
    }

    return { ...data, isFirstTimeLogin: false };
  };

  const signUp = async (email: string, password: string, displayName: string, studentCategory: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          student_category: studentCategory,
        }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
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

// Export AuthContext for testing
export { AuthContext };
