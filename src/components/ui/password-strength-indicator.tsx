import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  match?: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  showMatchIndicator?: boolean;
}

/**
 * PasswordStrengthIndicator component
 * Displays visual indicators for password requirements
 */
const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  confirmPassword = '',
  showMatchIndicator = false
}) => {
  const [validation, setValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  });

  // Update validation state when password changes
  useEffect(() => {
    setValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password === confirmPassword && password.length > 0
    });
  }, [password, confirmPassword]);

  // Calculate overall strength percentage
  const calculateStrength = () => {
    const criteria = ['length', 'uppercase', 'lowercase', 'number', 'special'];
    const validCount = criteria.filter(key => validation[key as keyof PasswordValidation]).length;
    return (validCount / criteria.length) * 100;
  };

  const strength = calculateStrength();
  
  // Determine color based on strength
  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  /**
   * Renders a validation item with appropriate icon
   */
  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className={`flex items-center space-x-2 text-sm ${
      isValid ? 'text-green-600' : 'text-muted-foreground'
    }`}>
      {isValid ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${getStrengthColor()}`} 
          style={{ width: `${strength}%` }}
        ></div>
      </div>
      
      {/* Requirements list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <ValidationItem isValid={validation.length} text="At least 8 characters" />
        <ValidationItem isValid={validation.uppercase} text="One uppercase letter" />
        <ValidationItem isValid={validation.lowercase} text="One lowercase letter" />
        <ValidationItem isValid={validation.number} text="One number" />
        <ValidationItem isValid={validation.special} text="One special character" />
        {showMatchIndicator && confirmPassword && (
          <ValidationItem isValid={validation.match || false} text="Passwords match" />
        )}
      </div>
    </div>
  );
};

export { PasswordStrengthIndicator, type PasswordValidation };