
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useUser, StudentCategory } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStudyReminders } from '@/hooks/useStudyReminders';
import ProfileImageSection from '@/components/profile/ProfileImageSection';
import SubscriptionStatusCard from '@/components/profile/SubscriptionStatusCard';
import NotificationCard from '@/components/profile/NotificationCard';
import ProfileForm from '@/components/profile/ProfileForm';
import ProfileActions from '@/components/profile/ProfileActions';

const ProfilePage = () => {
  const { user, setUser, loadUserData } = useUser();
  const { signOut, user: authUser } = useAuth();
  const { toast } = useToast(); 
  const { requestNotificationPermission } = useStudyReminders();
  const [displayName, setDisplayName] = useState('');
  const [studentCategory, setStudentCategory] = useState<StudentCategory>('college');
  const [profilePictureURL, setProfilePictureURL] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preferredStudyWeekdays, setPreferredStudyWeekdays] = useState<string[]>([]);
  const [preferredStudyStartTime, setPreferredStudyStartTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setStudentCategory(user.studentCategory || 'college');
      setProfilePictureURL(user.profilePictureURL || '');
      
      if (user.preferredStudyWeekdays && Array.isArray(user.preferredStudyWeekdays)) {
        setPreferredStudyWeekdays(user.preferredStudyWeekdays);
      } else {
        setPreferredStudyWeekdays([]);
      }
      
      setPreferredStudyStartTime(user.preferredStudyStartTime || '');
    } else if (authUser) {
      setDisplayName(authUser.user_metadata?.display_name || 'User');
      setStudentCategory(authUser.user_metadata?.student_category || 'college');
      setProfilePictureURL('');
      setPreferredStudyWeekdays([]);
      setPreferredStudyStartTime('');
    }
  }, [user, authUser]);

  useEffect(() => {
    const updateLastLogin = async () => {
      if (authUser) {
        try {
          const { error } = await supabase
            .from('users')
            .update({ lastloginat: new Date().toISOString() })
            .eq('userid', authUser.id);
          
          if (error) {
            console.error('Error updating last login:', error);
          }
        } catch (error) {
          console.error('Error in updateLastLogin:', error);
        }
      }
    };

    updateLastLogin();
  }, [authUser]);
  
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission('granted');
      toast({
        title: "Notifications Enabled",
        description: "You'll receive study reminders 15 minutes before your preferred study time.",
      });
    } else {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings to receive study reminders.",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveProfile = async () => {
    if (!authUser) {
      toast({
        title: "Error",
        description: "Please log in to save your profile.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    let newProfilePictureUrl = profilePictureURL;

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);
        
        if (urlData?.publicUrl) {
          newProfilePictureUrl = urlData.publicUrl;
        }
      }

      const weekdaysForDb = preferredStudyWeekdays.length > 0 ? preferredStudyWeekdays.join(',') : null;

      const userDataToSave = {
        displayname: displayName,
        studentcategory: studentCategory,
        profilepictureurl: newProfilePictureUrl || null,
        preferredstudyweekdays: weekdaysForDb,
        preferredstudystarttime: preferredStudyStartTime || null,
        lastloginat: new Date().toISOString()
      };

      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('userid')
        .eq('userid', authUser.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let error;
      if (existingUser) {
        const { error: updateError } = await supabase
          .from('users')
          .update(userDataToSave)
          .eq('userid', authUser.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            userid: authUser.id,
            email: authUser.email || '',
            passwordhash: '',
            emailverified: authUser.email_confirmed_at ? true : false,
            ...userDataToSave,
          });
        error = insertError;
      }
      
      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: `Failed to save profile: ${error.message}. Please try again.`,
          variant: "destructive"
        });
      } else {
        setUser(prevUser => ({
          ...(prevUser || { id: authUser.id, email: authUser.email || '', isSubscribed: false, subscriptionPlan: 'free' }),
          displayName,
          studentCategory,
          profilePictureURL: newProfilePictureUrl,
          preferredStudyWeekdays: preferredStudyWeekdays,
          preferredStudyStartTime: preferredStudyStartTime || null,
          id: authUser.id,
          email: authUser.email || '',
          isSubscribed: prevUser?.isSubscribed || false,
          subscriptionPlan: prevUser?.subscriptionPlan || 'free',
          lastLoginAt: new Date().toISOString()
        }));
        
        setSelectedFile(null);
        
        toast({
          title: "Success",
          description: "Profile updated successfully! Study reminders will be scheduled based on your preferences."
        });
        
        await loadUserData();
      }
    } catch (error: any) {
      console.error('Error in handleSaveProfile:', error);
      toast({
        title: "Error",
        description: `Profile save failed: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: `Failed to sign out: ${error.message}. Please try again.`,
        variant: "destructive"
      });
    }
  };
  
  return (
    <MainLayout>
      <div className="px-4 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-center">Profile</h1>
        
        <ProfileImageSection
          profilePictureURL={profilePictureURL}
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
        />
        
        <SubscriptionStatusCard user={user} />

        <NotificationCard
          notificationPermission={notificationPermission}
          onEnableNotifications={handleEnableNotifications}
        />
        
        <ProfileForm
          displayName={displayName}
          setDisplayName={setDisplayName}
          studentCategory={studentCategory}
          setStudentCategory={setStudentCategory}
          preferredStudyWeekdays={preferredStudyWeekdays}
          setPreferredStudyWeekdays={setPreferredStudyWeekdays}
          preferredStudyStartTime={preferredStudyStartTime}
          setPreferredStudyStartTime={setPreferredStudyStartTime}
        />
        
        <ProfileActions
          onSaveProfile={handleSaveProfile}
          onSignOut={handleSignOut}
          isLoading={isLoading}
        />
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
