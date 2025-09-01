import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Mail } from 'lucide-react';

/**
 * ResetPasswordPage component handles the actual password reset
 * when users click the reset link from their email
 */
const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [verificationErrorMessage, setVerificationErrorMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for error parameters in URL
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');
  
  // Check for token hash from password reset email (comes as URL parameters)
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  
  // Check for PKCE flow code parameter
  const code = searchParams.get('code');

  // DEBUG: Log URL params and page mount once
  useEffect(() => {
    const safeMask = (v: string | null) => {
      if (!v) return null;
      if (v.length <= 3) return `*** (len:${v.length})`;
      if (v.length <= 8) return `${v[0]}***${v[v.length - 1]} (len:${v.length})`;
      return `${v.slice(0, 4)}...${v.slice(-4)} (len:${v.length})`;
    };
    try {
      console.group('[ResetPassword] Mount + URL params');
      console.info('location.href', window.location.href);
      console.info('query', {
        codePresent: !!code,
        codeMasked: safeMask(code),
        tokenHashPresent: !!tokenHash,
        tokenHashMasked: safeMask(tokenHash),
        type,
        error,
        errorCode,
        errorDescription
      });
      console.groupEnd();
    } catch (e) {
      console.warn('[ResetPassword] Initial logging failed', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  });

  /**
   * Validates password against security requirements
   */
  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password === confirmPassword && password.length > 0
    });
  }, [password, confirmPassword]);

  /**
   * Verify the OTP token from the email link on component mount
   */
  useEffect(() => {
    const verifyResetToken = async () => {
      console.group('[ResetPassword] verifyResetToken()');
      console.info('start flags', {
        codePresent: !!code,
        tokenHashPresent: !!tokenHash,
        type,
        error,
        errorCode,
        errorDescription
      });
      // If there are error parameters, don't try to verify token
      if (error && errorCode) {
        console.warn('[ResetPassword] URL error params present - skipping verification', { error, errorCode, errorDescription });
        setVerifyingToken(false);
        let errorMessage = 'An error occurred with the password reset link.';
        
        if (errorCode === 'otp_expired') {
          errorMessage = 'The password reset link has expired. Please request a new one.';
        } else if (error === 'access_denied') {
          errorMessage = 'The password reset link is invalid or has already been used.';
        } else if (errorDescription) {
          errorMessage = errorDescription;
        }
        
        setVerificationFailed(true);
        setVerificationErrorMessage(errorMessage);
        toast({
          title: "Reset Link Error",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // Subscribe to auth state changes to catch auto session detection via detectSessionInUrl
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        try {
          console.info('[ResetPassword] onAuthStateChange', { event, sessionPresent: !!session, userId: session?.user?.id });
        } catch {}
        if (session) {
          setTokenVerified(true);
          setVerificationFailed(false);
          setVerificationErrorMessage(null);
          setVerifyingToken(false);
          toast({
            title: "Link Verified",
            description: "You can now set your new password.",
          });
        }
      });

      try {
        console.info('[ResetPassword] getSession() -> checking for existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.info('[ResetPassword] getSession() result', { sessionPresent: !!session, userId: session?.user?.id });
        
        if (session) {
          setTokenVerified(true);
          setVerificationFailed(false);
          setVerificationErrorMessage(null);
          setVerifyingToken(false);
          toast({
            title: "Link Verified",
            description: "You can now set your new password.",
          });
          authListener.subscription.unsubscribe();
          console.groupEnd();
          return;
        }
      } catch (error) {
        console.error('[ResetPassword] Error checking session', error);
      }

      // Handle PKCE flow with code parameter (fallback when auto-detect hasn't run or failed)
      if (code) {
        try {
          console.info('[ResetPassword] exchangeCodeForSession() attempting', { codePresent: !!code, codeLen: code.length });
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[ResetPassword] exchangeCodeForSession() error', { name: exchangeError.name, message: exchangeError.message, status: (exchangeError as any)?.status });
            throw exchangeError;
          }

          console.info('[ResetPassword] exchangeCodeForSession() success', { sessionPresent: !!data.session, userId: data.session?.user?.id });
          if (data.session) {
            setTokenVerified(true);
            setVerificationFailed(false);
            setVerificationErrorMessage(null);
            toast({
              title: "Link Verified",
              description: "You can now set your new password.",
            });
          } else {
            console.error('[ResetPassword] No session after code exchange');
            throw new Error('No session established after code exchange');
          }
        } catch (error: any) {
          console.error('[ResetPassword] exchangeCodeForSession() catch', { name: error?.name, message: error?.message, stack: error?.stack });
          setVerificationFailed(true);
          setVerificationErrorMessage(error?.message || 'The reset link is invalid or has expired.');
          toast({
            title: "Verification Failed",
            description: error?.message || "The reset link is invalid or has expired.",
            variant: "destructive"
          });
        }
      }
      // If we have token hash and type, verify the OTP to establish session (legacy flow)
      else if (tokenHash && type === 'recovery') {
        try {
          console.info('[ResetPassword] verifyOtp() attempting', { tokenHashLen: tokenHash.length, type });
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any
          });

          if (verifyError) {
            console.error('[ResetPassword] verifyOtp() error', { name: verifyError.name, message: verifyError.message, status: (verifyError as any)?.status });
            throw verifyError;
          }

          console.info('[ResetPassword] verifyOtp() success', { sessionPresent: !!data.session, userId: data.session?.user?.id });
          if (data.session) {
            setTokenVerified(true);
            setVerificationFailed(false);
            setVerificationErrorMessage(null);
            toast({
              title: "Link Verified",
              description: "You can now set your new password.",
            });
          } else {
            console.error('[ResetPassword] No session after verifyOtp');
            throw new Error('No session established after verification');
          }
        } catch (error: any) {
          console.error('[ResetPassword] verifyOtp() catch', { name: error?.name, message: error?.message, stack: error?.stack });
          setVerificationFailed(true);
          setVerificationErrorMessage(error?.message || 'The reset link is invalid or has expired.');
          toast({
            title: "Verification Failed",
            description: error?.message || "The reset link is invalid or has expired.",
            variant: "destructive"
          });
        }
      } else if (!code && !tokenHash) {
        console.warn('[ResetPassword] No tokens found in URL - likely direct access');
        // No valid tokens found, this might be a direct access
        setVerificationFailed(true);
        const msg = "Please use the reset link from your email.";
        setVerificationErrorMessage(msg);
        toast({
          title: "Invalid Access",
          description: msg,
          variant: "destructive"
        });
      } else {
        console.error('[ResetPassword] Tokens present but verification failed', { codePresent: !!code, tokenHashPresent: !!tokenHash, type });
        // We have tokens but verification failed
        setVerificationFailed(true);
        const msg = "The password reset link is invalid, has expired, or has already been used. Please request a new one.";
        setVerificationErrorMessage(msg);
        toast({
          title: "Reset Link Error",
          description: msg,
          variant: "destructive"
        });
      }
      
      setVerifyingToken(false);
      console.info('[ResetPassword] verifyResetToken() done');

      // Cleanup listener if still subscribed
      authListener.subscription.unsubscribe();
      console.groupEnd();
    };

    verifyResetToken();
  }, [code, tokenHash, type, error, errorCode, errorDescription, toast]);

  /**
   * Handles the password reset submission
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.group('[ResetPassword] handleResetPassword');
    try {
      console.info('passwordMeta', { passwordLength: password.length, confirmLength: confirmPassword.length });
      console.info('validation', passwordValidation);
    } catch {}
    
    if (password !== confirmPassword) {
      console.warn('[ResetPassword] Passwords do not match');
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      console.groupEnd();
      return;
    }

    if (!passwordValidation.length || !passwordValidation.uppercase || 
        !passwordValidation.lowercase || !passwordValidation.number || 
        !passwordValidation.special) {
      console.warn('[ResetPassword] Password fails security requirements', passwordValidation);
      toast({
        title: "Error",
        description: "Password does not meet security requirements.",
        variant: "destructive"
      });
      console.groupEnd();
      return;
    }

    setLoading(true);

    try {
      console.info('[ResetPassword] Calling supabase.auth.updateUser(password=***)');
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('[ResetPassword] updateUser error', { name: error.name, message: error.message, status: (error as any)?.status });
        throw error;
      }

      console.info('[ResetPassword] Password updated successfully -> navigating to /login');
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated. You can now sign in with your new password.",
      });

      // Redirect to login page
      navigate('/login');
    } catch (error: any) {
      console.error('[ResetPassword] handleResetPassword catch', { name: error?.name, message: error?.message, stack: error?.stack });
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  /**
   * Validation list item component for requirements display
   */
  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {isValid ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={isValid ? 'text-foreground' : 'text-muted-foreground'}>{text}</span>
    </div>
  );

  if (verifyingToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-500 mb-2">AAYRA</h1>
            <p className="text-muted-foreground">The Smarter way to Master more.</p>
          </div>
          <div className="bg-card p-8 rounded-lg shadow-md text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Verifying Reset Link...</h2>
              <p className="text-muted-foreground">Please wait while we verify your reset link.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there are error parameters in URL or token verification explicitly failed
  if ((error && errorCode) || verificationFailed || (!tokenVerified && !verifyingToken && !tokenHash && !code)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-500 mb-2">AAYRA</h1>
            <p className="text-muted-foreground">The Smarter way to Master more.</p>
          </div>
          
          <div className="bg-card p-8 rounded-lg shadow-md text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Reset Link Error</h2>
              <p className="text-muted-foreground mb-4">
                {verificationErrorMessage
                  ? verificationErrorMessage
                  : errorCode === 'otp_expired' 
                  ? 'The password reset link has expired. Links are only valid for a limited time for security reasons.'
                  : !tokenVerified && !verifyingToken
                  ? 'The password reset link is invalid, has expired, or has already been used. Please request a new one.'
                  : 'The password reset link is invalid or has already been used. Please request a new one.'}
              </p>
            </div>
            
            <div className="space-y-3">
              <Link to="/forgot-password">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  <Mail className="w-4 h-4 mr-2" />
                  Request New Reset Link
                </Button>
              </Link>
              
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-2">AAYRA</h1>
          <p className="text-muted-foreground">The Smarter way to Master more.</p>
        </div>
        
        <div className="bg-card p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Set New Password</h2>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium text-foreground mb-2">Password Requirements:</h4>
              <ValidationItem isValid={passwordValidation.length} text="At least 8 characters" />
              <ValidationItem isValid={passwordValidation.uppercase} text="One uppercase letter" />
              <ValidationItem isValid={passwordValidation.lowercase} text="One lowercase letter" />
              <ValidationItem isValid={passwordValidation.number} text="One number" />
              <ValidationItem isValid={passwordValidation.special} text="One special character" />
              {confirmPassword && (
                <ValidationItem isValid={passwordValidation.match} text="Passwords match" />
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading || !Object.values(passwordValidation).every(Boolean)}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;