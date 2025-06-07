import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';

const queryClient = new QueryClient();

// Simplified warning suppression for Recharts defaultProps warnings
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    if (/defaultProps/.test(args[0])) {
      return;
    }
    originalError(...args);
  };
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