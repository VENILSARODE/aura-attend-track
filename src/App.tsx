import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadData from "./pages/UploadData";
import FaceRecognition from "./pages/FaceRecognition";
import DataStore from "./pages/DataStore";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to login or dashboard */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload-data" element={<UploadData />} />
                <Route path="/face-recognition" element={<FaceRecognition />} />
                <Route path="/data-store" element={<DataStore />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
