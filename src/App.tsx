// src/App.tsx

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/ui/loading";
import { config } from "@/lib/config";
import { useAuth } from "@/auth/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { DashboardLayout } from '@/components/DashboardLayout';

// --- Lazy load ALL pages for better performance ---
const LandingPage = React.lazy(() => import("@/pages/Landing"));
const SignUp = React.lazy(() => import("@/pages/SignUp"));
const Login = React.lazy(() => import("@/pages/Login"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const POS = React.lazy(() => import("@/pages/POS"));
const Products = React.lazy(() => import("@/pages/Products"));
const Analytics = React.lazy(() => import("@/pages/Analytics"));
const AIInsights = React.lazy(() => import("@/pages/AIInsights"));
const Users = React.lazy(() => import("@/pages/Users"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

function ProtectedRoute() {
  const { user, session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Verifying session..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user) {
    return (
      <DashboardLayout>
        <LoadingScreen message="Loading user data..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function App() {
  useEffect(() => {
    document.title = `${config.app.name} - ${config.app.description}`;
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <React.Suspense fallback={<LoadingScreen message="Loading page..." />}>
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* --- Protected Routes --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/users" element={<Users />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;