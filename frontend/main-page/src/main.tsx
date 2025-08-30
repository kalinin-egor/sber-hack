
import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./presentation/stores/AuthContext";
import { App } from "./presentation/components/App";
import "./index.css";

// Главный компонент приложения с авторизацией
function AppWithAuth() {
  return (
    <AuthProvider children={<App />} />
  );
}

createRoot(document.getElementById("root")!).render(<AppWithAuth />);
