import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useUser, StudentCategory } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLoading } from '@/contexts/LoadingContext';
import ProfileImageSection from '@/components/profile/ProfileImageSection';
import BasicProfileForm from '@/components/profile/BasicProfileForm';
import ProfileActions from '@/components/profile/ProfileActions';

import { Button } from '@/components/ui/button';
import { Settings, HelpCircle } from 'lucide-react';

/**
 * Simplified ProfilePage component focused on essential user information
 */
const ProfilePage = () => {
  const { user, setUser, loadUserData } = useUser();
  const { signOut, user: authUser } = useAuth();
  const { toast } = useToast();
  const { withLoading } = useLoading();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState('');
  const [studentCategory, setStudentCategory] = useState<StudentCategory>('college');
  const [profilePictureURL, setProfilePictureURL] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preferredStudyWeekdays, setPreferredStudyWeekdays] = useState<string[]>([]);
  const [preferredStudyStartTime, setPreferredStudyStartTime] = useState('');



  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setStudentCategory(user.studentCategory || 'college');
      setProfilePictureURL(user.profilePictureURL || '');
      setPreferredStudyWeekdays(user.preferredStudyWeekdays || []);
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
  
  /**
   * Save current profile values to the backend.
   * - Uploads profile picture if selected
   * - Serializes preferredStudyWeekdays as a clean, comma-separated string (or null)
   * - Ensures the database column is overridden with the sanitized value
   */
  const handleSaveProfile = async () => {
    if (!authUser) {
      toast({
        title: "Error",
        description: "Please log in to save your profile.",
        variant: "destructive"
      });
      return;
    }
    
    await withLoading(async () => {
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

      // Sanitize and serialize weekdays for DB storage
      const sanitizedWeekdays = (preferredStudyWeekdays && preferredStudyWeekdays.length)
        ? Array.from(new Set(preferredStudyWeekdays)).join(',')
        : null;

      const userDataToSave = {
        displayname: displayName,
        studentcategory: studentCategory,
        profilepictureurl: newProfilePictureUrl || null,
        preferredstudyweekdays: sanitizedWeekdays,
         preferredstudystarttime: preferredStudyStartTime,
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
            subscription_plan: 'free',
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
          ...(prevUser || { 
            id: authUser.id, 
            email: authUser.email || '', 
            isSubscribed: false, 
            subscriptionPlan: 'free' 
          }),
          displayName,
          studentCategory,
          profilePictureURL: newProfilePictureUrl,
          preferredStudyWeekdays,
          preferredStudyStartTime,
          id: authUser.id,
          email: authUser.email || '',
          isSubscribed: prevUser?.isSubscribed || false,
          subscriptionPlan: prevUser?.subscriptionPlan || 'free',
          lastLoginAt: new Date().toISOString()
        }));
        
        setSelectedFile(null);
        
        await loadUserData();
      }
    } catch (error: any) {
      console.error('Error in handleSaveProfile:', error);
      toast({
        title: "Error",
        description: `Profile save failed: ${error.message}`,
        variant: "destructive"
      });
      throw error; // Re-throw to let withLoading handle the finally block
    }
    }, 'Saving profile...');
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
        />
        
        <BasicProfileForm
          displayName={displayName}
          setDisplayName={setDisplayName}
          studentCategory={studentCategory}
          setStudentCategory={(value: string) => setStudentCategory(value as StudentCategory)}
          preferredStudyWeekdays={preferredStudyWeekdays}
          setPreferredStudyWeekdays={setPreferredStudyWeekdays}
          preferredStudyStartTime={preferredStudyStartTime}
          setPreferredStudyStartTime={setPreferredStudyStartTime}
        />
        
        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 p-4"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 p-4"
            onClick={() => navigate('/help')}
          >
            <HelpCircle className="h-5 w-5" />
            Help
          </Button>
        </div>
        
        <ProfileActions
          onSaveProfile={handleSaveProfile}
          onSignOut={handleSignOut}
        />
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
