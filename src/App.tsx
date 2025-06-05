import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/ui/loading";
import { config } from "@/lib/config";
import { getCurrentUser } from "@/lib/api"; // Updated 
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

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = getCurrentUser(); // <-- UPDATE
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}


// Landing route wrapper
function LandingRoute({ children }: { children: React.ReactNode }) {
  const currentUser = getCurrentUser(); // <-- UPDATE
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  useEffect(() => {
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
        <React.Suspense fallback={<LoadingScreen message="Loading..." />}>
          <Routes>
            {/* ... (Routes remain the same) ... */}
          </Routes>
        </React.Suspense>
        <Toaster /> {/* <-- ADD TOASTER */}
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App; 
