import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useUser, StudentCategory } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUpload from '@/components/ui/image-upload';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preferredStudyWeekdays, setPreferredStudyWeekdays] = useState<string[]>([]);
  const [preferredStudyStartTime, setPreferredStudyStartTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setStudentCategory(user.studentCategory || 'college');
      setProfilePictureURL(user.profilePictureURL || '');
      if (Array.isArray(user.preferredStudyWeekdays)) {
        setPreferredStudyWeekdays(user.preferredStudyWeekdays);
      } else {
        // Handle the case where preferredStudyWeekdays is a string or null
        const weekdaysValue = user.preferredStudyWeekdays;
        if (weekdaysValue && typeof weekdaysValue === 'string') {
          const trimmedValue = weekdaysValue.trim();
          if (trimmedValue !== '') {
            const parsedDays = trimmedValue.split(',').map(day => day.trim()).filter(day => day);
            const validWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            setPreferredStudyWeekdays(parsedDays.filter(day => validWeekdays.includes(day)));
          } else {
            setPreferredStudyWeekdays([]);
          }
        } else {
          setPreferredStudyWeekdays([]);
        }
      }
      setPreferredStudyStartTime(user.preferredStudyStartTime || '');
    } else if (authUser) {
      setDisplayName(authUser.user_metadata?.display_name || 'User');
      setStudentCategory(authUser.user_metadata?.student_category || 'college');
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
  
  const handleSaveProfile = async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    let newProfilePictureUrl = user?.profilePictureURL || null;

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

      // Convert array to comma-separated string for database storage
      const weekdaysForDb = preferredStudyWeekdays.length > 0 ? preferredStudyWeekdays.join(',') : null;

      const userDataToSave = {
        displayname: displayName,
        studentcategory: studentCategory,
        profilepictureurl: newProfilePictureUrl,
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
          description: "Profile updated successfully!"
        });
        
        await loadUserData();
      }
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: `Failed to sign out: ${error.message}. Please try again.`,
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
        
        <div className="flex justify-center mb-6">
          <ImageUpload
            currentImageUrl={profilePictureURL}
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
            data-testid="profile-image-upload"
          />
        </div>
        
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
                  onSelect={(e) => e.preventDefault()}
                >
                  All Weekdays
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {weekdaysDefinition.map((day) => (
                  <DropdownMenuCheckboxItem
                    key={day}
                    checked={preferredStudyWeekdays.includes(day)}
                    onCheckedChange={() => handleWeekdayToggle(day)}
                    onSelect={(e) => e.preventDefault()}
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
