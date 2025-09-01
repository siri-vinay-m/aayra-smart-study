
import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-toggle";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { SessionProvider } from "./contexts/SessionContext";
import { TimerProvider } from "./contexts/TimerContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { useStudyReminders } from "./hooks/useStudyReminders";
import { useMobileFeatures } from "./hooks/useMobileFeatures";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RootRedirect from "./components/auth/RootRedirect";
import { PerformanceMonitor } from "./utils/performanceOptimizations";
import { simpleMobileNotificationService } from "./services/mobileNotificationService";
import { Capacitor } from "@capacitor/core";
import { enhancedNotificationService } from "./services/enhancedNotificationService";
import LandingPage from "./components/LandingPage";

// Critical pages loaded immediately
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";

import DebugPage from "./pages/DebugPage";

// Non-critical pages loaded lazily
const RegistrationPage = lazy(() => import("./pages/RegistrationPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const NewSessionPage = lazy(() => import("./pages/NewSessionPage"));
const NotificationTest = lazy(() => import("./components/NotificationTest"));
const FocusTimerPage = lazy(() => import("./pages/FocusTimerPage"));
const BreakTimerPage = lazy(() => import("./pages/BreakTimerPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const ValidationPage = lazy(() => import("./pages/ValidationPage"));
const ReviewSessionPage = lazy(() => import("./pages/ReviewSessionPage"));
const CompletedSessionsPage = lazy(() => import("./pages/CompletedSessionsPage"));
const IncompleteSessionsPage = lazy(() => import("./pages/IncompleteSessionsPage"));
const PendingReviewsPage = lazy(() => import("./pages/PendingReviewsPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NotificationTester = lazy(() => import("./components/notifications/NotificationTester"));

// Optimized QueryClient configuration for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

// Performance monitoring setup
const performanceMonitor = PerformanceMonitor.getInstance();

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Component to handle study reminders, mobile features, and smart notifications with performance monitoring
const StudyReminderManager = React.memo(() => {
  useStudyReminders();
  useMobileFeatures();
  
  // Initialize notification services
  React.useEffect(() => {
    const initializeNotificationServices = async () => {
      try {
        // Initialize enhanced notification service (registers SW, requests permission, initializes smart service)
        await enhancedNotificationService.initialize();
        console.log('Enhanced notification service initialized successfully');
        
        // Initialize mobile notification service on mobile platforms
        if (Capacitor.isNativePlatform()) {
          await simpleMobileNotificationService.initialize();
          console.log('Mobile notification service initialized successfully');
          
          // Request notification permissions for mobile
           const permissionGranted = await simpleMobileNotificationService.requestPermissions();
           if (permissionGranted) {
             console.log('Mobile notification permissions granted');
          } else {
            console.log('Mobile notification permissions denied');
          }
        }
      } catch (error) {
        console.error('Failed to initialize notification services:', error);
      }
    };
    
    initializeNotificationServices();
  }, []);
  
  // Monitor app performance
  React.useEffect(() => {
    performanceMonitor.startTiming('app-initialization');
    
    const handleLoad = () => {
      performanceMonitor.endTiming('app-initialization');
      
      // Log performance report in development
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => performanceMonitor.logPerformanceReport(), 1000);
      }
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);
  
  return null;
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="aayra-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <UserProvider>
                <SessionProvider>
                  <TimerProvider>
                    <LoadingProvider>
                      <StudyReminderManager />
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<RootRedirect />} />
                        <Route path="/index" element={<Index />} />
                        <Route path="/landing" element={<LandingPage />} />

                        <Route path="/debug" element={<DebugPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegistrationPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                        <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
                        <Route path="/test-notifications" element={<ProtectedRoute><NotificationTest /></ProtectedRoute>} />
                        <Route path="/test-notifications-enhanced" element={<ProtectedRoute><NotificationTester /></ProtectedRoute>} />
                        <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
                        <Route path="/new-session" element={<ProtectedRoute><NewSessionPage /></ProtectedRoute>} />
                        <Route path="/focus-timer" element={<ProtectedRoute><FocusTimerPage /></ProtectedRoute>} />
                        <Route path="/break-timer" element={<ProtectedRoute><BreakTimerPage /></ProtectedRoute>} />
                        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
                        <Route path="/validation" element={<ProtectedRoute><ValidationPage /></ProtectedRoute>} />
                        <Route path="/review/:sessionId" element={<ProtectedRoute><ReviewSessionPage /></ProtectedRoute>} />
                        <Route path="/completed-sessions" element={<ProtectedRoute><CompletedSessionsPage /></ProtectedRoute>} />
                        <Route path="/incomplete-sessions" element={<ProtectedRoute><IncompleteSessionsPage /></ProtectedRoute>} />
                        <Route path="/pending-reviews" element={<ProtectedRoute><PendingReviewsPage /></ProtectedRoute>} />
                        <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    </LoadingProvider>
                  </TimerProvider>
                </SessionProvider>
              </UserProvider>
            </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
