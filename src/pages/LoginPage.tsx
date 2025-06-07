
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import AayraLogo from '@/components/ui/aayra-logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn(email, password);
      // Redirect based on whether this is a first-time login
      if (result.isFirstTimeLogin) {
        navigate('/profile');
      } else {
        navigate('/home');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-3 sm:px-4">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <AayraLogo size={40} className="sm:w-12 sm:h-12" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">AAYRA</h2>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Sign in to your account</p>
        </div>
        
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Log In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Link 
                to="/forgot-password" 
                className="text-xs sm:text-sm text-orange-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 h-10 sm:h-11" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="text-center mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-orange-500 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
