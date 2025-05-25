
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
  preferredStudyWeekdays: string[] | null;
  preferredStudyStartTime: string | null;
  isSubscribed: boolean;
  subscriptionPlan: 'free' | 'premium' | null;
  lastLoginAt?: string | null;
  currentSubscriptionId?: string | null;
}

export interface UpdateUserPayload {
  displayName?: string;
  studentCategory?: StudentCategory | null;
  profilePictureURL?: string | null;
  preferredStudyWeekdays?: string[] | null;
  preferredStudyStartTime?: string | null;
  currentSubscriptionId?: string | null;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  loadUserData: () => Promise<void>;
  updateUserProfile: (updates: UpdateUserPayload) => Promise<{ success: boolean; error?: any }>;
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
        .from('users')
        .select('*')
        .eq('userid', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user data:', error);
        return;
      }

      if (userData) {
        // Parse weekdays - handle both array and comma-separated string formats
        let parsedWeekdays: string[] | null = null;
        if (userData.preferredstudyweekdays) {
          if (Array.isArray(userData.preferredstudyweekdays)) {
            parsedWeekdays = userData.preferredstudyweekdays;
          } else if (typeof userData.preferredstudyweekdays === 'string') {
            parsedWeekdays = userData.preferredstudyweekdays.split(',').map(day => day.trim()).filter(day => day);
          }
        }

        setUser({
          id: userData.userid,
          displayName: userData.displayname,
          email: userData.email,
          studentCategory: userData.studentcategory as StudentCategory,
          profilePictureURL: userData.profilepictureurl,
          preferredStudyWeekdays: parsedWeekdays,
          preferredStudyStartTime: userData.preferredstudystarttime,
          isSubscribed: false,
          subscriptionPlan: 'free',
          lastLoginAt: userData.lastloginat || null,
          currentSubscriptionId: userData.currentsubscriptionid || null
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
    }
  };

  const updateUserProfile = async (updates: UpdateUserPayload): Promise<{ success: boolean; error?: any }> => {
    if (!user || !user.id) {
      return { success: false, error: new Error("User not available") };
    }

    const supabasePayload: { [key: string]: any } = {};
    if (updates.displayName !== undefined) supabasePayload.displayname = updates.displayName;
    if (updates.studentCategory !== undefined) supabasePayload.studentcategory = updates.studentCategory;
    if (updates.profilePictureURL !== undefined) supabasePayload.profilepictureurl = updates.profilePictureURL;
    if (updates.preferredStudyWeekdays !== undefined) supabasePayload.preferredstudyweekdays = updates.preferredStudyWeekdays;
    if (updates.preferredStudyStartTime !== undefined) supabasePayload.preferredstudystarttime = updates.preferredStudyStartTime;
    if (updates.currentSubscriptionId !== undefined) supabasePayload.currentsubscriptionid = updates.currentSubscriptionId;

    if (Object.keys(supabasePayload).length === 0) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(supabasePayload)
        .eq('userid', user.id);

      if (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error };
      }

      setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser };
        if (updates.displayName !== undefined) updatedUser.displayName = updates.displayName;
        if (updates.studentCategory !== undefined) updatedUser.studentCategory = updates.studentCategory;
        if (updates.profilePictureURL !== undefined) updatedUser.profilePictureURL = updates.profilePictureURL;
        if (updates.preferredStudyWeekdays !== undefined) updatedUser.preferredStudyWeekdays = updates.preferredStudyWeekdays as string[] | null;
        if (updates.preferredStudyStartTime !== undefined) updatedUser.preferredStudyStartTime = updates.preferredStudyStartTime;
        if (updates.currentSubscriptionId !== undefined) updatedUser.currentSubscriptionId = updates.currentSubscriptionId;
        return updatedUser;
      });

      return { success: true };
    } catch (error) {
      console.error('Exception in updateUserProfile:', error);
      return { success: false, error };
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
      loadUserData,
      updateUserProfile
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

export { UserContext };
