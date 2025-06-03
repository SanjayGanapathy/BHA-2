import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/ui/loading";
import { POSStore } from "@/lib/store";
import { config } from "@/lib/config";

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

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = POSStore.getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Landing route wrapper
function LandingRoute({ children }: { children: React.ReactNode }) {
  const currentUser = POSStore.getCurrentUser();

  // If user is logged in, redirect to dashboard
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  useEffect(() => {
    // Initialize the POS store when the app starts
    POSStore.initializeStore();

    // Set up app metadata
    document.title = `${config.app.name} - ${config.app.description}`;

    // Add theme color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", config.ui.theme.primary);
    }

    // Performance monitoring (in production)
    if (config.env.isProduction) {
      // Add performance monitoring here
      console.log(`${config.app.name} v${config.app.version} loaded`);
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <React.Suspense
          fallback={<LoadingScreen message="Loading Bull Horn Analytics..." />}
        >
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <LandingRoute>
                  <Landing />
                </LandingRoute>
              }
            />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <POS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-insights"
              element={
                <ProtectedRoute>
                  <AIInsights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
