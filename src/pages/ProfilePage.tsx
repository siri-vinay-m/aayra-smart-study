
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useUser, UpdateUserPayload, StudentCategory } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUpload from '@/components/ui/image-upload';
// Removed duplicate: import { useUser, type StudentCategory } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown } from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser, loadUserData, setIsAuthenticated, updateUserProfile } = useUser(); // One useUser import is kept (from line 3)
  const { signOut, user: authUser } = useAuth();
  const { toast } = useToast(); 
  const [displayName, setDisplayName] = useState('');
  const [studentCategory, setStudentCategory] = useState<StudentCategory>('college');
  const [profilePictureURL, setProfilePictureURL] = useState(''); // This will hold the URL from DB or the new preview for saving
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For the new image file
  const [preferredStudyWeekdays, setPreferredStudyWeekdays] = useState<string[]>([]); // Changed to string array
  const [preferredStudyStartTime, setPreferredStudyStartTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // The first handleSaveProfile (lines 26-44 in original file) is removed as it's unused and incomplete.
  // The second handleSaveProfile (lines 73-144 in original) is the one being modified.

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setStudentCategory(user.studentCategory || 'college');
      setProfilePictureURL(user.profilePictureURL || ''); // Initialize with URL from DB
      // Handle loading of preferredStudyWeekdays (string[] or string from DB)
      if (Array.isArray(user.preferredStudyWeekdays)) {
        setPreferredStudyWeekdays(user.preferredStudyWeekdays);
      } else if (typeof user.preferredStudyWeekdays === 'string' && user.preferredStudyWeekdays.trim() !== '') {
        // Attempt to parse if it's a comma-separated string (legacy)
        const parsedDays = user.preferredStudyWeekdays.split(',').map(day => day.trim()).filter(day => day);
        // Ensure only valid days are set, comparing against a defined list if necessary
        const validWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        setPreferredStudyWeekdays(parsedDays.filter(day => validWeekdays.includes(day)));
      } else {
        setPreferredStudyWeekdays([]); // Default to empty array if null, undefined, or empty string
      }
      setPreferredStudyStartTime(user.preferredStudyStartTime || '');
    } else if (authUser) {
      // Set defaults from auth user metadata
      setDisplayName(authUser.user_metadata?.display_name || 'User');
      setStudentCategory(authUser.user_metadata?.student_category || 'college');
    }
  }, [user, authUser]);
  
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    // If a new file is selected, ProfilePage doesn't need to manage its preview URL directly.
    // ImageUpload component handles its own internal preview.
    // ProfilePictureURL will be updated with the actual storage URL on save.
    // If the user clears the selection (file is null), we can decide if we want to revert to original DB URL or clear preview.
    // For now, selectedFile being null means no new upload.
  };
  
  const handleSaveProfile = async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    let newProfilePictureUrl = user?.profilePictureURL || null; // Start with existing URL

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`; // Bucket is 'profile-pictures'

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true, // Overwrite if file with same name exists (good for user retrying upload)
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);
        
        if (!urlData || !urlData.publicUrl) {
          throw new Error("Could not get public URL for uploaded image.");
        }
        newProfilePictureUrl = urlData.publicUrl;
      }

      // User data to save, including the new (or existing) profile picture URL
      const userDataToSave = {
        displayname: displayName,
        studentcategory: studentCategory,
        profilepictureurl: newProfilePictureUrl,
        preferredstudyweekdays: preferredStudyWeekdays.length > 0 ? preferredStudyWeekdays : null,
        preferredstudystarttime: preferredStudyStartTime || null,
      };

      // Check if user record exists
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
            passwordhash: '', // Managed by Supabase Auth
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
        // Update local user state
        setUser(prevUser => ({
          ...(prevUser || { id: authUser.id, email: authUser.email || '', isSubscribed: false, subscriptionPlan: 'free' }),
          displayName,
          studentCategory,
          profilePictureURL: newProfilePictureUrl, // Use the potentially updated URL
          preferredStudyWeekdays: preferredStudyWeekdays,
          preferredStudyStartTime: preferredStudyStartTime || null,
          id: authUser.id,
          email: authUser.email || '',
          isSubscribed: prevUser?.isSubscribed || false,
          subscriptionPlan: prevUser?.subscriptionPlan || 'free'
        }));
        
        setSelectedFile(null); // Clear selected file after successful save
        // The ImageUpload component will update its preview based on currentImageUrl prop change if needed
        // or its internal preview state will be reset on next selection.
        
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
        
        // Reload user data to ensure consistency, especially for profilePictureURL from DB
        await loadUserData();
      }
    } catch (error: any) {
      console.error('Error in handleSaveProfile:', error);
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
          preferredStudyWeekdays: preferredStudyWeekdays, // setUser expects string[] as per UserContext change
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
    } catch (error: any) { // Added type any for error
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: `Failed to sign out: ${error.message}. Please try again.`, // More specific error
        variant: "destructive"
      });
    }
  };

  const weekdaysDefinition = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleWeekdayToggle = (day: string) => {
    setPreferredStudyWeekdays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSelectAllWeekdays = (checked: boolean) => {
    if (checked) {
      setPreferredStudyWeekdays(weekdaysDefinition);
    } else {
      setPreferredStudyWeekdays([]);
    }
  };
  
  return (
    <MainLayout>
      <div className="px-4 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-center">Profile</h1>
        
        {/* Profile Picture Section */}
        <div className="flex justify-center mb-6">
          <ImageUpload
            currentImageUrl={profilePictureURL} // This is the URL from the database
            onFileSelect={handleFileSelect}    // This callback receives the File object
            isLoading={isLoading}              // Pass loading state for UI feedback in ImageUpload
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
            <Label htmlFor="weekdays-trigger">Preferred Study Weekdays</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button id="weekdays-trigger" variant="outline" className="w-full justify-start font-normal">
                  {preferredStudyWeekdays.length === 0
                    ? "Select weekdays"
                    : preferredStudyWeekdays.length === weekdaysDefinition.length
                    ? "All weekdays"
                    : preferredStudyWeekdays.sort((a, b) => weekdaysDefinition.indexOf(a) - weekdaysDefinition.indexOf(b)).join(', ')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuLabel>Select Days</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={preferredStudyWeekdays.length === weekdaysDefinition.length && weekdaysDefinition.length > 0}
                  onCheckedChange={handleSelectAllWeekdays}
                  onSelect={(e) => e.preventDefault()} // Prevent menu closing
                >
                  All Weekdays
                </DropdownMenuCheckboxItem>
                {weekdaysDefinition.map((day) => (
                  <DropdownMenuCheckboxItem
                    key={day}
                    checked={preferredStudyWeekdays.includes(day)}
                    onCheckedChange={() => handleWeekdayToggle(day)} // onCheckedChange for checkbox item passes boolean
                    onSelect={(e) => e.preventDefault()} // Prevent menu closing
                  >
                    {day}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
