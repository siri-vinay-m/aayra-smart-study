
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Trash } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

const ProfilePage = () => {
  const { user, setUser, setIsAuthenticated } = useUser();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [category, setCategory] = useState<string>(user?.studentCategory || '');
  const [weekdays, setWeekdays] = useState<string>(user?.preferredStudyWeekdays || '');
  const [startTime, setStartTime] = useState<string>(user?.preferredStudyStartTime || '');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  const handleSaveProfile = () => {
    if (user) {
      setUser({
        ...user,
        displayName,
        studentCategory: category as any,
        preferredStudyWeekdays: weekdays,
        preferredStudyStartTime: startTime
      });
    }
    
    navigate('/');
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/login');
  };
  
  const handleUploadProfilePicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        if (user && event.target?.result) {
          setUser({
            ...user,
            profilePicture: event.target.result as string
          });
        }
        setProfileDialogOpen(false);
      };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleRemoveProfilePicture = () => {
    if (user) {
      setUser({
        ...user,
        profilePicture: null
      });
    }
    setProfileDialogOpen(false);
  };
  
  return (
    <MainLayout>
      <div className="px-4 pb-8">
        <h1 className="text-2xl font-semibold mb-6">Profile</h1>
        
        <div className="flex items-center mb-8">
          <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogTrigger asChild>
              <div className="flex items-center cursor-pointer">
                <Avatar className="h-20 w-20 mr-4">
                  {user?.profilePicture ? (
                    <AvatarImage 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gray-200 text-3xl font-medium text-gray-600">
                      {displayName.charAt(0) || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-primary hover:underline">Edit Profile Picture</p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Profile Picture</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-2">
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                  <Camera size={20} />
                  <span>Upload New Picture</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleUploadProfilePicture}
                  />
                </label>
                
                {user?.profilePicture && (
                  <Button 
                    variant="outline" 
                    className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={handleRemoveProfilePicture}
                  >
                    <Trash size={16} className="mr-2" />
                    Remove Profile Picture
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Student Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
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
          
          <div className="space-y-2">
            <Label htmlFor="weekdays">Preferred Study Weekdays</Label>
            <Select value={weekdays} onValueChange={setWeekdays}>
              <SelectTrigger className="border-primary focus:ring-primary">
                <SelectValue placeholder="Select weekdays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="weekends">Weekends</SelectItem>
                <SelectItem value="mon_wed_fri">Monday, Wednesday, Friday</SelectItem>
                <SelectItem value="tue_thu">Tuesday, Thursday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start-time">Preferred Study Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="text-primary font-semibold focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2">Subscription</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{user?.subscriptionPlan === 'premium' ? 'Premium Plan' : 'Free Plan'}</p>
                  <p className="text-sm text-gray-600">
                    {user?.subscriptionPlan === 'premium' 
                      ? 'Unlimited access to all features' 
                      : 'Limited to 2 sessions per day'}
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary-dark">
                  {user?.isSubscribed ? 'Manage' : 'Upgrade'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-6">
            <Button 
              onClick={handleSaveProfile}
              className="w-full bg-primary hover:bg-primary-dark"
            >
              Save Changes
            </Button>
            
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="w-full"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
