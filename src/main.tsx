import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';

const queryClient = new QueryClient();

// Comprehensive warning suppression for Recharts defaultProps warnings
if (import.meta.env.DEV) {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  // Helper function to detect Recharts defaultProps warnings
  const isRechartsWarning = (...args: any[]): boolean => {
    try {
      const message = args.join(" ");
      const hasDefaultPropsMessage = message.includes(
        "Support for defaultProps will be removed",
      );
      return hasDefaultPropsMessage;
    } catch (e) {
      return false;
    }
  };

  // Override console methods
  console.warn = (...args) => {
    if (!isRechartsWarning(...args)) {
      originalWarn.apply(console, args);
    }
  };

  console.error = (...args) => {
    if (!isRechartsWarning(...args)) {
      originalError.apply(console, args);
    }
  };

  console.log = (...args) => {
    if (!isRechartsWarning(...args)) {
      originalLog.apply(console, args);
    }
  };

  // Intercept window error events that might be related
  window.addEventListener("error", (event) => {
    if (event.message && isRechartsWarning(event.message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason && isRechartsWarning(String(event.reason))) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);