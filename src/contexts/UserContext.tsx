import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type StudentCategory = 
  | 'high_school'
  | 'college'
  | 'competitive_exams'
  | 'professional'
  | 'lifelong_learner';

export interface User {
  id: string;
  displayName: string;
  email: string;
  studentCategory: StudentCategory | null;
  profilePictureURL: string | null;
  preferredStudyWeekdays: string[] | null;
  preferredStudyStartTime: string | null;
  isSubscribed: boolean;
  subscriptionPlan: 'free' | 'free-for-life' | 'premium' | null;
  subscriptionStatus?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  daysRemaining?: number | null;
	subscriptionDaysRemaining?: number | null;
  sessionsPerDay?: number | null;
  sessionsPerWeek?: number | null;
  adsEnabled?: boolean | null;
  isTrial?: boolean | null;
  lastLoginAt?: string | null;
  currentSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  // Session counts are now calculated dynamically in useSessionLimits
  // sessionsUsedToday and sessionsUsedThisWeek removed from User interface
  premiumPrice?: number | null;
  weeklyStudyGoal?: number | null;
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
  checkSubscriptionStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function to validate subscription plan
const validateSubscriptionPlan = (plan: string | null): 'free' | 'free-for-life' | 'premium' | null => {
  if (!plan) return null;
  if (plan === 'free' || plan === 'free-for-life' || plan === 'premium') {
    return plan;
  }
  return 'free'; // Default to free if invalid plan
};

// Helper function to calculate subscription days remaining
const calculateSubscriptionDaysRemaining = (registrationDate: string, subscriptionPlan: string | null): number => {
  if (!registrationDate || subscriptionPlan === 'premium' || subscriptionPlan === 'free-for-life') {
    return 0;
  }
  
  const now = new Date();
  const regDate = new Date(registrationDate);
  const daysSinceRegistration = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, 45 - daysSinceRegistration);
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { user: authUser, session } = useAuth();

  const checkSubscriptionStatus = async () => {
    if (!authUser) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      if (data) {
        // Update user state with subscription details
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            isSubscribed: data.subscribed || false,
            subscriptionPlan: validateSubscriptionPlan(data.subscription_plan),
            subscriptionStatus: data.subscription_status,
            subscriptionStartDate: data.subscription_start_date,
            subscriptionEndDate: data.subscription_end_date,
            daysRemaining: data.days_remaining,
            sessionsPerDay: data.sessions_per_day,
            sessionsPerWeek: data.sessions_per_week,
            adsEnabled: data.ads_enabled,
            isTrial: data.is_trial,
            premiumPrice: data.premium_price
          };
        });
      }
    } catch (error) {
      console.error('Error in checkSubscriptionStatus:', error);
    }
  };

  const loadUserData = async () => {
    if (!authUser) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      // First get user data from users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('userid', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user data:', error);
        return;
      }

      // Get subscription status using our database function
      const { data: subscriptionData, error: subError } = await supabase
        .rpc('get_user_subscription_status', { user_id_param: authUser.id });

      if (subError) {
        console.error('Error loading subscription data:', subError);
      }

      const subscriptionInfo = subscriptionData && subscriptionData.length > 0 ? subscriptionData[0] : null;

      // Get subscription plan details from subscriptionplans table
      const userPlan = subscriptionInfo?.plan_name || userData?.subscription_plan || 'free';
      let { data: planDetails, error: planError } = await supabase
        .from('subscriptionplans')
        .select('price, maxsessionsperday, maxsessionsperweek')
        .eq('planname', userPlan)
        .single();

      if (planError) {
        console.error('Error getting subscription plan details:', planError);
      }
      
      console.log('Plan details for', userPlan, ':', planDetails);
      
      // If no plan details found, try to create default plans
      if (!planDetails && userPlan === 'free') {
        console.log('No free plan found, creating default plans...');
        try {
          await supabase.from('subscriptionplans').upsert([
            {
              planname: 'free',
              price: 0,
              maxsessionsperday: 2,
              maxsessionsperweek: 14,
              billingcycle: 'monthly',
              adsenabled: true,
              isactive: true
            },
            {
              planname: 'premium',
              price: 9.99,
              maxsessionsperday: null,
              maxsessionsperweek: null,
              billingcycle: 'monthly',
              adsenabled: false,
              isactive: true
            }
          ], { onConflict: 'planname' });
          
          // Retry fetching plan details
          const { data: retryPlanDetails } = await supabase
            .from('subscriptionplans')
            .select('price, maxsessionsperday, maxsessionsperweek')
            .eq('planname', userPlan)
            .single();
          
          if (retryPlanDetails) {
            console.log('Successfully created and fetched plan details:', retryPlanDetails);
            // Update planDetails with the retry result
            planDetails = retryPlanDetails;
          }
        } catch (error) {
          console.error('Error creating default subscription plans:', error);
        }
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

        // Calculate real-time subscription days remaining based on registration date
        const calculatedDaysRemaining = calculateSubscriptionDaysRemaining(
          authUser.created_at, 
          userData.subscription_plan
        );

        setUser({
          id: userData.userid,
          displayName: userData.displayname,
          email: userData.email,
          studentCategory: userData.studentcategory as StudentCategory,
          profilePictureURL: userData.profilepictureurl,
          preferredStudyWeekdays: parsedWeekdays,
          preferredStudyStartTime: userData.preferredstudystarttime,
          isSubscribed: subscriptionInfo?.plan_name === 'premium' || false,
          subscriptionPlan: validateSubscriptionPlan(subscriptionInfo?.plan_name || userData.subscription_plan),
          subscriptionStatus: subscriptionInfo?.status,
          subscriptionStartDate: subscriptionInfo?.start_date,
          subscriptionEndDate: subscriptionInfo?.end_date,
          daysRemaining: subscriptionInfo?.days_remaining,
					subscriptionDaysRemaining: calculatedDaysRemaining,
          sessionsPerDay: planDetails?.maxsessionsperday ?? subscriptionInfo?.sessions_per_day ?? (userPlan === 'free' ? 2 : null),
          sessionsPerWeek: planDetails?.maxsessionsperweek ?? subscriptionInfo?.sessions_per_week ?? (userPlan === 'free' ? 14 : null),
          adsEnabled: subscriptionInfo?.ads_enabled,
          isTrial: subscriptionInfo?.is_trial,
          lastLoginAt: userData.lastloginat || null,
          currentSubscriptionId: userData.currentsubscriptionid || null,
          stripeCustomerId: userData.stripe_customer_id,
          stripeSubscriptionId: userData.stripe_subscription_id,
          // Session counts are now calculated dynamically in useSessionLimits
          // sessionsUsedToday and sessionsUsedThisWeek removed from UserContext
          premiumPrice: userPlan === 'premium' ? planDetails?.price || 9.99 : 9.99,
        });
      } else {
        // Create new user record if none exists
        const calculatedDaysRemaining = calculateSubscriptionDaysRemaining(authUser.created_at, 'free');
        
        // Get free plan details from subscriptionplans table
        const { data: freePlanDetails, error: freePlanError } = await supabase
          .from('subscriptionplans')
          .select('maxsessionsperday, maxsessionsperweek')
          .eq('planname', 'free')
          .single();

        if (freePlanError) {
          console.error('Error getting free plan details:', freePlanError);
        }
        
        console.log('Free plan details:', freePlanDetails);
        
        // If no free plan details found, use defaults
        if (!freePlanDetails) {
          console.log('No free plan details found, using defaults');
        }
        
        const newUserData = {
          userid: authUser.id,
          email: authUser.email || '',
          displayname: authUser.user_metadata?.display_name || 'User',
          studentcategory: authUser.user_metadata?.student_category || 'college',
          passwordhash: '',
          emailverified: authUser.email_confirmed_at ? true : false,
          subscription_plan: 'free',
					subscription_days_remaining: calculatedDaysRemaining,
        };

        await supabase.from('users').insert(newUserData);
        
        setUser({
          id: authUser.id,
          displayName: authUser.user_metadata?.display_name || 'User',
          email: authUser.email || '',
          studentCategory: authUser.user_metadata?.student_category || 'college',
          profilePictureURL: null,
          preferredStudyWeekdays: null,
          preferredStudyStartTime: null,
          isSubscribed: false,
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          daysRemaining: calculatedDaysRemaining,
					subscriptionDaysRemaining: calculatedDaysRemaining,
          sessionsPerDay: freePlanDetails?.maxsessionsperday ?? 2,
          sessionsPerWeek: freePlanDetails?.maxsessionsperweek ?? 14,
          adsEnabled: true,
          isTrial: true,
          lastLoginAt: null,
          currentSubscriptionId: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          // Session counts are now calculated dynamically in useSessionLimits
          // sessionsUsedToday and sessionsUsedThisWeek removed from UserContext
          premiumPrice: 9.99,
        });
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
    if (updates.preferredStudyWeekdays !== undefined) {
      const v = updates.preferredStudyWeekdays;
      supabasePayload.preferredstudyweekdays = v && v.length ? Array.from(new Set(v)).join(',') : null;
    }
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
    if (session && authUser) {
      // Set authenticated immediately when we have a valid session
      setIsAuthenticated(true);
      loadUserData();
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [session, authUser]);

  // Check subscription status on mount and when user changes
  useEffect(() => {
    if (authUser && session) {
      checkSubscriptionStatus();
    }
  }, [authUser, session]);

  return (
    <UserContext.Provider value={{ 
      user,
      setUser,
      isAuthenticated,
      setIsAuthenticated,
      loadUserData,
      updateUserProfile,
      checkSubscriptionStatus
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
