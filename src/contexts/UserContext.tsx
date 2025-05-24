
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type StudentCategory = 
  | 'high_school'
  | 'college'
  | 'competitive_exams'
  | 'professional'
  | 'lifelong_learner';

interface User {
  id: string;
  displayName: string;
  email: string;
  studentCategory: StudentCategory | null;
  profilePictureURL: string | null;
  preferredStudyWeekdays: string | null;
  preferredStudyStartTime: string | null;
  isSubscribed: boolean;
  subscriptionPlan: 'free' | 'premium' | null;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  loadUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { user: authUser, session } = useAuth();

  const loadUserData = async () => {
    if (!authUser) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const { data: userData, error } = await supabase
        .from('Users')
        .select('*')
        .eq('UserID', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        return;
      }

      if (userData) {
        setUser({
          id: userData.UserID,
          displayName: userData.DisplayName,
          email: userData.Email,
          studentCategory: userData.StudentCategory as StudentCategory,
          profilePictureURL: userData.ProfilePictureURL,
          preferredStudyWeekdays: userData.PreferredStudyWeekdays,
          preferredStudyStartTime: userData.PreferredStudyStartTime,
          isSubscribed: false, // This would be calculated based on UserSubscriptions
          subscriptionPlan: 'free'
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
    }
  };

  useEffect(() => {
    if (session) {
      loadUserData();
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [session, authUser]);

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      isAuthenticated, 
      setIsAuthenticated,
      loadUserData 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
