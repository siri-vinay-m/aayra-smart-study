import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BasicProfileFormProps {
  displayName: string;
  setDisplayName: (value: string) => void;
  studentCategory: string;
  setStudentCategory: (value: string) => void;
  preferredStudyWeekdays: string[];
  setPreferredStudyWeekdays: (value: string[]) => void;
  preferredStudyStartTime: string;
  setPreferredStudyStartTime: (value: string) => void;
}

const BasicProfileForm: React.FC<BasicProfileFormProps> = ({
  displayName,
  setDisplayName,
  studentCategory,
  setStudentCategory,
  preferredStudyWeekdays,
  setPreferredStudyWeekdays,
  preferredStudyStartTime,
  setPreferredStudyStartTime,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm border p-4 mb-4">
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="studentCategory">Student Category</Label>
          <Select value={studentCategory} onValueChange={setStudentCategory}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high-school">High School</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="lifelong-learner">Lifelong learner</SelectItem>
              <SelectItem value="competitive-exam">Competitive Exam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Preferred Study Weekdays</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={preferredStudyWeekdays.includes(day)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPreferredStudyWeekdays([...preferredStudyWeekdays, day]);
                    } else {
                      setPreferredStudyWeekdays(preferredStudyWeekdays.filter(d => d !== day));
                    }
                  }}
                />
                <Label htmlFor={day} className="text-sm">{day}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="preferredStudyStartTime">Preferred Study Start Time</Label>
          <Input
            id="preferredStudyStartTime"
            type="time"
            value={preferredStudyStartTime}
            onChange={(e) => setPreferredStudyStartTime(e.target.value)}
            className="mt-1"
            placeholder="Select your preferred start time"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicProfileForm;