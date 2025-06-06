import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/ui/loading";
import { config } from "@/lib/config";
import { useAuth } from "./auth/AuthProvider";
import { Toaster } from "@/components/ui/toaster";

// Lazy load components for better performance
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Login = React.lazy(() => import("@/pages/Login"));
const Landing = React.lazy(() => import("@/pages/Landing"));
const POS = React.lazy(() => import("@/pages/POS"));
const Products = React.lazy(() => import("@/pages/Products"));
const Analytics = React.lazy(() => import("@/pages/Analytics"));
const AIInsights = React.lazy(() => import("@/pages/AIInsights"));
const Users = React.lazy(() => import("@/pages/Users"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

// Protected Route wrapper now uses the useAuth hook
function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Renders the child route element
  return <Outlet />;
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
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes are now nested */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
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