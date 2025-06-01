
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { StudentCategory } from '@/contexts/UserContext';

interface ProfileFormProps {
  displayName: string;
  setDisplayName: (name: string) => void;
  studentCategory: StudentCategory;
  setStudentCategory: (category: StudentCategory) => void;
  preferredStudyWeekdays: string[];
  setPreferredStudyWeekdays: (weekdays: string[]) => void;
  preferredStudyStartTime: string;
  setPreferredStudyStartTime: (time: string) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  displayName,
  setDisplayName,
  studentCategory,
  setStudentCategory,
  preferredStudyWeekdays,
  setPreferredStudyWeekdays,
  preferredStudyStartTime,
  setPreferredStudyStartTime
}) => {
  const weekdaysDefinition = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleWeekdayToggle = (day: string) => {
    const newWeekdays = preferredStudyWeekdays.includes(day) 
      ? preferredStudyWeekdays.filter(d => d !== day) 
      : [...preferredStudyWeekdays, day];
    setPreferredStudyWeekdays(newWeekdays);
  };

  const handleSelectAllWeekdays = (checked: boolean) => {
    if (checked) {
      setPreferredStudyWeekdays(weekdaysDefinition);
    } else {
      setPreferredStudyWeekdays([]);
    }
  };

  return (
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
  );
};

export default ProfileForm;
