// src/App.tsx

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/ui/loading";
import { config } from "@/lib/config";
import { useAuth } from "@/auth/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { DashboardLayout } from '@/components/DashboardLayout';
import { hasPermission } from "@/lib/permissions";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Products from "@/pages/Products";
import Analytics from "@/pages/Analytics";
import AIInsights from "@/pages/AIInsights";
import Users from "@/pages/Users";
import NotFound from "@/pages/NotFound";

function ProtectedRoute({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredPermission?: string;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/dashboard" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function App() {
  useEffect(() => {
    document.title = `${config.app.name} - ${config.app.description}`;
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <React.Suspense fallback={<LoadingScreen message="Loading page..." />}>
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* --- Protected Routes --- */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/pos" 
              element={
                <ProtectedRoute requiredPermission="create_sale">
                  <POS />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/products" 
              element={
                <ProtectedRoute requiredPermission="manage_products">
                  <Products />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute requiredPermission="view_analytics">
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/ai-insights" 
              element={
                <ProtectedRoute requiredPermission="view_ai_insights">
                  <AIInsights />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredPermission="view_users">
                  <Users />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
        <Toaster />
      </Router>
    </ErrorBoundary>
  );
}

export default App;