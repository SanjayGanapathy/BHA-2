// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

      // Check for React's warning template pattern with %s placeholders
      const hasTemplate =
        args[0] && typeof args[0] === "string" && args[0].includes("%s");
      const hasDefaultPropsMessage = message.includes(
        "Support for defaultProps will be removed",
      );
      const hasAxisComponents =
        message.includes("XAxis") ||
        message.includes("YAxis") ||
        message.includes("XAxis2") ||
        message.includes("YAxis2");
      const hasRechartsContext =
        message.includes("recharts.js") ||
        message.includes("CategoricalChartWrapper") ||
        message.includes("ChartLayoutContextProvider");

      return (
        // React warning pattern for defaultProps
        (hasTemplate && hasDefaultPropsMessage) ||
        // Direct message match
        hasDefaultPropsMessage ||
        // Axis component warnings
        (hasAxisComponents &&
          (message.includes("defaultProps") || hasDefaultPropsMessage)) ||
        // Recharts-specific context
        (hasRechartsContext &&
          (message.includes("defaultProps") || hasDefaultPropsMessage))
      );
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

  // Intercept window error events
  window.addEventListener("error", (event) => {
    if (event.message && isRechartsWarning(event.message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  // Intercept unhandled promise rejections that might contain warnings
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason && isRechartsWarning(String(event.reason))) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
