import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress Recharts defaultProps warnings while preserving other warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  // Filter out specific Recharts defaultProps warnings
  const message = args[0];
  if (
    typeof message === "string" &&
    message.includes(
      "Support for defaultProps will be removed from function components",
    ) &&
    (message.includes("XAxis") || message.includes("YAxis"))
  ) {
    return;
  }
  // Pass through all other warnings
  originalWarn.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
