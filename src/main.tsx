import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CaptainsProvider } from "./context/CaptainsContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <CaptainsProvider>
        <App />
      </CaptainsProvider>
    </AuthProvider>
  </React.StrictMode>
);
