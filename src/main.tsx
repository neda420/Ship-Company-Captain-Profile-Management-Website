import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CaptainsProvider } from "./context/CaptainsContext";
import { ToastProvider } from "./context/ToastContext";

// 1. Extract and compose all global providers into a single wrapper
const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <CaptainsProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </CaptainsProvider>
    </AuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 2. The root render remains flat, clean, and easy to read */}
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
