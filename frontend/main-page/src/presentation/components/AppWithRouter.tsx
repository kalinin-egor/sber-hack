import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from '../stores/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AuthPage } from './auth/AuthPage';
import App from '../../App';

// Компонент для обработки успешной авторизации
function AuthPageWrapper() {
  const navigate = useNavigate();
  
  const handleAuthSuccess = () => {
    // Используем navigate вместо window.location.href
    navigate('/', { replace: true });
  };
  
  return (
    <ProtectedRoute requireAuth={false}>
      <AuthPage onAuthSuccess={handleAuthSuccess} />
    </ProtectedRoute>
  );
}

export function AppWithRouter() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Страница авторизации */}
          <Route
            path="/auth"
            element={<AuthPageWrapper />}
          />
          
          {/* Главная страница (защищенная) */}
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={true}>
                <App />
              </ProtectedRoute>
            }
          />
          
          {/* Редирект на главную страницу для всех остальных путей */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
