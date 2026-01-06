import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute, PublicRoute } from "@/lib/auth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NidsLogs from "./pages/NidsLogs";
import HidsLogs from "./pages/HidsLogs";
import CorrelatedLogs from "./pages/CorrelatedLogs";
import InstallAgent from "./pages/InstallAgent";
import ActiveAgents from "./pages/ActiveAgents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/nids-logs" element={<ProtectedRoute><NidsLogs /></ProtectedRoute>} />
            <Route path="/hids-logs" element={<ProtectedRoute><HidsLogs /></ProtectedRoute>} />
            <Route path="/correlated-logs" element={<ProtectedRoute><CorrelatedLogs /></ProtectedRoute>} />
            <Route path="/install-agent" element={<ProtectedRoute><InstallAgent /></ProtectedRoute>} />
            <Route path="/agents/active" element={<ProtectedRoute><ActiveAgents /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
