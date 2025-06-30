
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  currentImageUrl?: string | null; // This will be the URL from Supabase or a local preview URL
  onFileSelect: (file: File | null) => void; // Changed to pass File object
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImageUrl, 
  onFileSelect, 
  className = "" 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  // Local state for previewing the image before it's uploaded
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onFileSelect(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file (e.g., PNG, JPG).",
        variant: "destructive"
      });
      onFileSelect(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB.",
        variant: "destructive"
      });
      onFileSelect(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      return;
    }

    onFileSelect(file); // Pass the file to the parent

    // Create a data URL for local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Determine what image to display: preview, current URL from DB, or placeholder
  const displayUrl = previewUrl || currentImageUrl || '/placeholder.svg';
  const showPlaceholderIcon = !previewUrl && !currentImageUrl;

  return (
    <div className={`relative ${className}`} data-testid="profile-image-upload"> {/* Added data-testid */}
      <div 
        className="w-24 h-24 rounded-full bg-muted flex items-center justify-center relative overflow-hidden border-2 border-border transition-colors cursor-pointer hover:border-orange-500"
        onClick={handleClick}
        title="Change profile picture"
      >
        {showPlaceholderIcon ? (
          <Camera size={32} className="text-muted-foreground" />
        ) : (
          <img 
            src={displayUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <Upload size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange} // Changed handler
        className="hidden"
      />
      

    </div>
  );
};

export default ImageUpload;
