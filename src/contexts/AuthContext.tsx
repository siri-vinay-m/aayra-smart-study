
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
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // If user signs in, create/update user record in Users table
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('userid', session.user.id)
                .single();

              if (!existingUser) {
                // Create user record if it doesn't exist
                const { error } = await supabase
                  .from('users')
                  .insert({
                    userid: session.user.id,
                    email: session.user.email || '',
                    displayname: session.user.user_metadata?.display_name || 'User',
                    studentcategory: session.user.user_metadata?.student_category || 'college',
                    passwordhash: '', // Managed by Supabase Auth
                    emailverified: session.user.email_confirmed_at ? true : false
                  });

                if (error) {
                  console.error('Error creating user record:', error);
                }
              }
              // Always update lastloginat on SIGNED_IN event
              const { error: updateError } = await supabase
                .from('users')
                .update({ lastloginat: new Date().toISOString() })
                .eq('userid', session.user.id);

              if (updateError) {
                console.error('Error updating lastloginat:', updateError);
              }
              
            } catch (error) {
              console.error('Error handling user record or lastloginat:', error);
            }
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
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
