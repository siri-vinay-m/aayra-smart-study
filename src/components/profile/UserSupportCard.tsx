import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG } from '@/config/app.config';
import { ExternalLink, MessageSquare, Lightbulb, AlertCircle, Play } from 'lucide-react';

type SupportType = 'feedback' | 'feature-request' | 'issue';

interface SupportFormData {
  type: SupportType;
  title: string;
  description: string;
}

/**
 * UserSupportCard component provides user support features including
 * feedback form and onboarding tour link
 */
const UserSupportCard: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SupportFormData>({
    type: 'feedback',
    title: '',
    description: ''
  });

  /**
   * Handles form submission and sends email to support team
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create email content
      const emailSubject = `[${formData.type.toUpperCase()}] ${formData.title}`;
      const emailBody = `
Type: ${formData.type}
Title: ${formData.title}

Description:
${formData.description}

Submitted from: Aayra Smart Study App
Timestamp: ${new Date().toISOString()}`;
      
      // Send email using mailto (for now) - in production, you'd use a backend service
      const mailtoLink = `mailto:${APP_CONFIG.support.emails.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open email client
      window.open(mailtoLink, '_blank');
      
      // Reset form
      setFormData({ type: 'feedback', title: '', description: '' });
      
      toast({
        title: "Support Request Sent",
        description: "Your email client has been opened. Please send the email to complete your request.",
      });
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: "Error",
        description: "Failed to open email client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Opens the onboarding tour video
   */
  const handleOnboardingTour = () => {
    window.open(APP_CONFIG.support.onboardingVideoUrl, '_blank', 'noopener,noreferrer');
  };

  /**
   * Gets the appropriate icon for support type
   */
  const getSupportTypeIcon = (type: SupportType) => {
    switch (type) {
      case 'feedback':
        return <MessageSquare className="h-4 w-4" />;
      case 'feature-request':
        return <Lightbulb className="h-4 w-4" />;
      case 'issue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          User Support
        </CardTitle>
        <CardDescription>
          Get help, share feedback, or request new features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Onboarding Tour Link */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Need help getting started?</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOnboardingTour}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Onboarding Tour
          </Button>
        </div>

        {/* Support Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={formData.type}
              onValueChange={(value: SupportType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getSupportTypeIcon(formData.type)}
                    <span className="capitalize">{formData.type.replace('-', ' ')}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feedback">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Feedback
                  </div>
                </SelectItem>
                <SelectItem value="feature-request">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Feature Request
                  </div>
                </SelectItem>
                <SelectItem value="issue">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Issue
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Brief summary of your request"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Please provide detailed information about your feedback, feature request, or issue..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.description.length}/1000 characters
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
          >
            {isSubmitting ? 'Sending...' : 'Send Support Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserSupportCard;