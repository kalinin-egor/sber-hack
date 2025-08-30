
import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./presentation/stores/AuthContext";
import { App } from "./presentation/components/App";
import "./index.css";

// Обработка глобальных ошибок
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Главный компонент приложения с авторизацией
function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

// Проверяем наличие root элемента
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found");
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found</div>';
} else {
  try {
    const root = createRoot(rootElement);
    root.render(<AppWithAuth />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering app:", error);
    rootElement.innerHTML = '<div style="padding: 20px; color: red;">Error loading application: ' + error + '</div>';
  }
}
