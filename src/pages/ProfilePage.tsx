
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUpload from '@/components/ui/image-upload';
import { useUser, type StudentCategory } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown } from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser, loadUserData } = useUser();
  const { signOut, user: authUser } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [studentCategory, setStudentCategory] = useState<StudentCategory>('college');
  const [profilePictureURL, setProfilePictureURL] = useState('');
  const [preferredStudyWeekdays, setPreferredStudyWeekdays] = useState('');
  const [preferredStudyStartTime, setPreferredStudyStartTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setStudentCategory(user.studentCategory || 'college');
      setProfilePictureURL(user.profilePictureURL || '');
      setPreferredStudyWeekdays(user.preferredStudyWeekdays || '');
      setPreferredStudyStartTime(user.preferredStudyStartTime || '');
    } else if (authUser) {
      // Set defaults from auth user metadata
      setDisplayName(authUser.user_metadata?.display_name || 'User');
      setStudentCategory(authUser.user_metadata?.student_category || 'college');
    }
  }, [user, authUser]);
  
  const handleImageChange = (imageUrl: string) => {
    setProfilePictureURL(imageUrl);
  };
  
  const handleSaveProfile = async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    
    try {
      // Check if user record exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('userid')
        .eq('userid', authUser.id)
        .maybeSingle();

      let error;
      
      if (existingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('users')
          .update({
            displayname: displayName,
            studentcategory: studentCategory,
            profilepictureurl: profilePictureURL || null,
            preferredstudyweekdays: preferredStudyWeekdays || null,
            preferredstudystarttime: preferredStudyStartTime || null
          })
          .eq('userid', authUser.id);
        
        error = updateError;
      } else {
        // Create new user record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            userid: authUser.id,
            email: authUser.email || '',
            displayname: displayName,
            studentcategory: studentCategory,
            passwordhash: '', // Managed by Supabase Auth
            emailverified: authUser.email_confirmed_at ? true : false,
            profilepictureurl: profilePictureURL || null,
            preferredstudyweekdays: preferredStudyWeekdays || null,
            preferredstudystarttime: preferredStudyStartTime || null
          });
        
        error = insertError;
      }
      
      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "Failed to save profile. Please try again.",
          variant: "destructive"
        });
      } else {
        // Update local user state
        setUser({
          id: authUser.id,
          displayName,
          email: authUser.email || '',
          studentCategory,
          profilePictureURL: profilePictureURL || null,
          preferredStudyWeekdays: preferredStudyWeekdays || null,
          preferredStudyStartTime: preferredStudyStartTime || null,
          isSubscribed: user?.isSubscribed || false,
          subscriptionPlan: user?.subscriptionPlan || 'free'
        });
        
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
        
        // Reload user data to ensure consistency
        await loadUserData();
      }
    } catch (error) {
      console.error('Error in handleSaveProfile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <MainLayout>
      <div className="px-4 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-center">Profile</h1>
        
        {/* Profile Picture Section */}
        <div className="flex justify-center mb-6">
          <ImageUpload
            currentImageUrl={profilePictureURL}
            onImageChange={handleImageChange}
          />
        </div>
        
        {/* Subscription Status Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown size={20} className={user?.subscriptionPlan === 'premium' ? 'text-yellow-500' : 'text-gray-400'} />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Plan:</span>
              <span className={`font-medium capitalize ${
                user?.subscriptionPlan === 'premium' ? 'text-yellow-600' : 'text-gray-900'
              }`}>
                {user?.subscriptionPlan || 'Free'}
              </span>
            </div>
            {user?.subscriptionPlan === 'free' && (
              <Button 
                variant="outline" 
                className="w-full mt-3 border-orange-500 text-orange-500 hover:bg-orange-50"
              >
                Upgrade to Premium
              </Button>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>
          
          <div>
            <Label htmlFor="studentCategory">Student Category</Label>
            <Select value={studentCategory} onValueChange={(value) => setStudentCategory(value as StudentCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high_school">High School</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="competitive_exams">Competitive Exams</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="lifelong_learner">Lifelong Learner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="weekdays">Preferred Study Weekdays</Label>
            <Input
              id="weekdays"
              type="text"
              value={preferredStudyWeekdays}
              onChange={(e) => setPreferredStudyWeekdays(e.target.value)}
              placeholder="Mon, Wed, Fri"
            />
          </div>
          
          <div>
            <Label htmlFor="startTime">Preferred Study Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={preferredStudyStartTime}
              onChange={(e) => setPreferredStudyStartTime(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={handleSaveProfile} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
          
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
