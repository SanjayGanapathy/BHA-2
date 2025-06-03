import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Helper function to check if a warning is a Recharts defaultProps warning
const isRechartsDefaultPropsWarning = (...args: any[]): boolean => {
  try {
    const stringArgs = args.map((arg) => String(arg));
    const fullMessage = stringArgs.join(" ");

    // Get the stack trace to check for Recharts
    const stack = new Error().stack || "";

    return (
      // Check for React warning template patterns
      (stringArgs[0] &&
        typeof stringArgs[0] === "string" &&
        stringArgs[0].includes("Support for defaultProps will be removed")) ||
      // Check for the specific warning message in any argument
      fullMessage.includes(
        "Support for defaultProps will be removed from function components",
      ) ||
      // Check for component names in the context of defaultProps warnings
      (fullMessage.includes("defaultProps") &&
        (fullMessage.includes("XAxis") ||
          fullMessage.includes("YAxis") ||
          fullMessage.includes("XAxis2") ||
          fullMessage.includes("YAxis2"))) ||
      // Check if any argument contains XAxis or YAxis and we have defaultProps context
      (stringArgs.some(
        (arg) => arg.includes("XAxis") || arg.includes("YAxis"),
      ) &&
        (fullMessage.includes("defaultProps") ||
          fullMessage.includes("function components"))) ||
      // Check stack trace for Recharts origin
      (stack.includes("recharts.js") &&
        (fullMessage.includes("defaultProps") ||
          fullMessage.includes("function components"))) ||
      // Catch React development warning patterns
      (stringArgs[0] &&
        stringArgs[0].includes("%s") &&
        stringArgs.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("XAxis") || arg.includes("YAxis")),
        ))
    );
  } catch (e) {
    // If anything fails, don't suppress the warning
    return false;
  }
};

// Suppress Recharts defaultProps warnings while preserving other warnings
// Only suppress in development mode to avoid hiding important warnings in production
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  const originalError = console.error;

  // Intercept React's internal warning system
  const originalReactWarn = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
    ?.onCommitFiberRoot;
  if (originalReactWarn) {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot =
      function (...args: any[]) {
        // Check if this is a warning we want to suppress
        if (!isRechartsDefaultPropsWarning(...args)) {
          return originalReactWarn.apply(this, args);
        }
      };
  }

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

  // Also intercept any React warnings that might bypass console.warn
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    if (isRechartsDefaultPropsWarning(...args)) {
      return;
    }
    originalConsoleLog.apply(console, args);
  };

  // Add event listener for unhandled warning events
  window.addEventListener("error", (event) => {
    if (event.message && isRechartsDefaultPropsWarning(event.message)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
