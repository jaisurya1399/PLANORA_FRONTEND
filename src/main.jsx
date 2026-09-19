import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { ConfirmDialogProvider } from "./components/common/ConfirmDialogProvider";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

import { ThemeModeProvider } from "./theme/ThemeModeContext";

import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <AppErrorBoundary>
                <App />
              </AppErrorBoundary>
            </ConfirmDialogProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
