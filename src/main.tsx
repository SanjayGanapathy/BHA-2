import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Helper function to check if a warning is a Recharts defaultProps warning
const isRechartsDefaultPropsWarning = (...args: any[]): boolean => {
  const stringArgs = args.map((arg) => String(arg));
  const fullMessage = stringArgs.join(" ");

  return (
    // Check for React warning patterns
    (stringArgs[0] && stringArgs[0].includes("%s")) ||
    // Check for the specific warning message
    fullMessage.includes(
      "Support for defaultProps will be removed from function components",
    ) ||
    // Check for component names in the context of defaultProps warnings
    (fullMessage.includes("defaultProps") &&
      (fullMessage.includes("XAxis") ||
        fullMessage.includes("YAxis") ||
        fullMessage.includes("XAxis2") ||
        fullMessage.includes("YAxis2"))) ||
    // Check stack trace for Recharts
    (fullMessage.includes("recharts.js") &&
      fullMessage.includes("defaultProps"))
  );
};

// Suppress Recharts defaultProps warnings while preserving other warnings
// Only suppress in development mode to avoid hiding important warnings in production
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    // Check the first argument (warning template) and any subsequent arguments
    const [template, ...restArgs] = args;
    const fullMessage = args.join(" ");

    // Filter out Recharts defaultProps warnings - check both template and filled message
    if (
      (typeof template === "string" &&
        template.includes("Support for defaultProps will be removed")) ||
      fullMessage.includes(
        "Support for defaultProps will be removed from function components",
      ) ||
      fullMessage.includes("defaultProps will be removed") ||
      (fullMessage.includes("XAxis") && fullMessage.includes("defaultProps")) ||
      (fullMessage.includes("YAxis") && fullMessage.includes("defaultProps")) ||
      restArgs.some(
        (arg) =>
          typeof arg === "string" &&
          (arg.includes("XAxis") || arg.includes("YAxis")),
      )
    ) {
      return;
    }

    // Pass through all other warnings
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    // Also filter console.error in case warnings are logged as errors
    if (isRechartsDefaultPropsWarning(...args)) {
      return;
    }

    // Pass through all other errors
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
