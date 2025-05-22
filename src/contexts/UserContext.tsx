
import React, { createContext, useState, useContext, ReactNode } from 'react';

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
  profilePicture: string | null;
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: '1',
    displayName: 'John Doe',
    email: 'john@example.com',
    studentCategory: 'college',
    profilePicture: null,
    preferredStudyWeekdays: 'Mon,Wed,Fri',
    preferredStudyStartTime: '09:00',
    isSubscribed: false,
    subscriptionPlan: 'free'
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  return (
    <UserContext.Provider value={{ user, setUser, isAuthenticated, setIsAuthenticated }}>
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
