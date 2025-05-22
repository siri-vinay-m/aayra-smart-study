
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { UserProvider } from "./contexts/UserContext";
import { SessionProvider } from "./contexts/SessionContext";
import { TimerProvider } from "./contexts/TimerContext";

import HomePage from "./pages/HomePage";
import RegistrationPage from "./pages/RegistrationPage";
import NewSessionPage from "./pages/NewSessionPage";
import FocusTimerPage from "./pages/FocusTimerPage";
import UploadPage from "./pages/UploadPage";
import ValidationPage from "./pages/ValidationPage";
import BreakTimerPage from "./pages/BreakTimerPage";
import PendingReviewsPage from "./pages/PendingReviewsPage";
import CompletedSessionsPage from "./pages/CompletedSessionsPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UserProvider>
        <SessionProvider>
          <BrowserRouter>
            <TimerProvider>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/new-session" element={<NewSessionPage />} />
                <Route path="/focus" element={<FocusTimerPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/validation" element={<ValidationPage />} />
                <Route path="/break" element={<BreakTimerPage />} />
                <Route path="/pending-reviews" element={<PendingReviewsPage />} />
                <Route path="/completed-sessions" element={<CompletedSessionsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TimerProvider>
          </BrowserRouter>
        </SessionProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
