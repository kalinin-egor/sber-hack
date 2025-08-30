
import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./presentation/stores/AuthContext";
import { AuthPage } from "./presentation/components/auth/AuthPage";
import App from "./App";
import { motion, AnimatePresence } from "motion/react";
import "./index.css";

// Компонент для условного рендеринга на основе состояния авторизации
function AuthenticatedApp() {
  const { state } = useAuth();

  return (
    <AnimatePresence mode="wait">
      {state.isAuthenticated ? (o
        <motion.div
          key="app"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
        >
          <App />
        </motion.div>
      ) : (
        <motion.div
          key="auth"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.5 }}
        >
          <AuthPage onAuthSuccess={() => {
            // Авторизация завершена, состояние обновится автоматически через AuthContext
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Главный компонент приложения с авторизацией (без роутинга)
function AppWithAuth() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(<AppWithAuth />);
