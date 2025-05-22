
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/UserContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser, setIsAuthenticated } = useUser();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // For demo - simple validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // For demo - we're just doing a mock login
    // In a real app, you'd validate with a backend
    if (email === 'demo@example.com' && password === 'password') {
      setIsAuthenticated(true);
      setUser({
        id: '1',
        displayName: 'John Doe',
        email: email,
        studentCategory: 'college',
        profilePicture: null,
        preferredStudyWeekdays: 'Mon,Wed,Fri',
        preferredStudyStartTime: '09:00',
        isSubscribed: false,
        subscriptionPlan: 'free'
      });
      navigate('/home');
    } else {
      // For demo purpose, allow any login
      setIsAuthenticated(true);
      setUser({
        id: '1',
        displayName: 'User',
        email: email,
        studentCategory: null,
        profilePicture: null,
        preferredStudyWeekdays: null,
        preferredStudyStartTime: null,
        isSubscribed: false,
        subscriptionPlan: 'free'
      });
      navigate('/home'); // Always navigate to home page after login
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-2">AAYRA</h1>
          <p className="text-gray-600">The Smarter way to Master more.</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Log In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
              Log In
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p>
              Don't have an account?{' '}
              <a href="/register" className="text-orange-500 hover:underline">
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
