import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import TitlePage from "./pages/TitlePage";
import AboutPage from "./pages/AboutPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ChildCheck from "./pages/ChildCheck";
import Dashboard from "./pages/Dashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RegisterChild from "./pages/RegisterChild";
import ParentVerification from "./pages/ParentVerification";
import CommunityReport from "./pages/CommunityReport";
import PanicAlert from "./pages/PanicAlert";
import RfidPage from "./pages/RfidPage";
import SmartIdPage from "./pages/SmartIdPage";
import SightingReport from "./pages/SightingReport";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<TitlePage />} />
              <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/child-check" element={<ProtectedRoute><ChildCheck /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/volunteer" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/register-child" element={<ProtectedRoute><RegisterChild /></ProtectedRoute>} />
              <Route path="/parent-verification" element={<ProtectedRoute><ParentVerification /></ProtectedRoute>} />
              <Route path="/community-report" element={<ProtectedRoute><CommunityReport /></ProtectedRoute>} />
              <Route path="/panic-alert" element={<ProtectedRoute><PanicAlert /></ProtectedRoute>} />
              <Route path="/rfid" element={<ProtectedRoute><RfidPage /></ProtectedRoute>} />
              <Route path="/smart-id" element={<ProtectedRoute><SmartIdPage /></ProtectedRoute>} />
              <Route path="/sighting-report" element={<ProtectedRoute><SightingReport /></ProtectedRoute>} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
