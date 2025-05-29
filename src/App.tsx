
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { SessionProvider } from "./contexts/SessionContext";
import { TimerProvider } from "./contexts/TimerContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RootRedirect from './components/auth/RootRedirect';

import HomePage from "./pages/HomePage";
import RegistrationPage from "./pages/RegistrationPage";
import NewSessionPage from "./pages/NewSessionPage";
import FocusTimerPage from "./pages/FocusTimerPage";
import UploadPage from "./pages/UploadPage";
import ValidationPage from "./pages/ValidationPage";
import BreakTimerPage from "./pages/BreakTimerPage";
import PendingReviewsPage from "./pages/PendingReviewsPage";
import ReviewSessionPage from "./pages/ReviewSessionPage";
import CompletedSessionsPage from "./pages/CompletedSessionsPage";
import IncompleteSessionsPage from "./pages/IncompleteSessionsPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <UserProvider>
              <SessionProvider>
                <TimerProvider>
                  <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegistrationPage />} />
                    <Route path="/home" element={
                      <ProtectedRoute>
                        <HomePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/new-session" element={
                      <ProtectedRoute>
                        <NewSessionPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/focus" element={
                      <ProtectedRoute>
                        <FocusTimerPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/upload" element={
                      <ProtectedRoute>
                        <UploadPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/validation" element={
                      <ProtectedRoute>
                        <ValidationPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/break" element={
                      <ProtectedRoute>
                        <BreakTimerPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/pending-reviews" element={
                      <ProtectedRoute>
                        <PendingReviewsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/review/:sessionId" element={
                      <ProtectedRoute>
                        <ReviewSessionPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/completed-sessions" element={
                      <ProtectedRoute>
                        <CompletedSessionsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/incomplete-sessions" element={
                      <ProtectedRoute>
                        <IncompleteSessionsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/favorites" element={
                      <ProtectedRoute>
                        <FavoritesPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TimerProvider>
              </SessionProvider>
            </UserProvider>
          </AuthProvider>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
