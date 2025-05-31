
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { SessionProvider } from "./contexts/SessionContext";
import { TimerProvider } from "./contexts/TimerContext";
import { useStudyReminders } from "./hooks/useStudyReminders";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RootRedirect from "./components/auth/RootRedirect";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import NewSessionPage from "./pages/NewSessionPage";
import FocusTimerPage from "./pages/FocusTimerPage";
import BreakTimerPage from "./pages/BreakTimerPage";
import UploadPage from "./pages/UploadPage";
import ValidationPage from "./pages/ValidationPage";
import ReviewSessionPage from "./pages/ReviewSessionPage";
import CompletedSessionsPage from "./pages/CompletedSessionsPage";
import IncompleteSessionsPage from "./pages/IncompleteSessionsPage";
import PendingReviewsPage from "./pages/PendingReviewsPage";
import FavoritesPage from "./pages/FavoritesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle study reminders
const StudyReminderManager = () => {
  useStudyReminders();
  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UserProvider>
              <SessionProvider>
                <TimerProvider>
                  <StudyReminderManager />
                  <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/index" element={<Index />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegistrationPage />} />
                    <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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
                </TimerProvider>
              </SessionProvider>
            </UserProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
