
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProfilePage = () => {
  const { user, setUser, setIsAuthenticated } = useUser();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [category, setCategory] = useState<string>(user?.studentCategory || '');
  const [weekdays, setWeekdays] = useState<string>(user?.preferredStudyWeekdays || '');
  const [startTime, setStartTime] = useState<string>(user?.preferredStudyStartTime || '');
  
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
  
  return (
    <MainLayout hideBottomBar>
      <div className="px-4 pb-8">
        <h1 className="text-2xl font-semibold mb-6">Profile</h1>
        
        <div className="flex items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-4 cursor-pointer">
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-medium text-gray-600">
                {displayName.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div>
            <p className="text-gray-600">Edit Profile Picture</p>
          </div>
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
              <SelectTrigger>
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
