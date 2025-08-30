import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../stores/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AuthPage } from './auth/AuthPage';
import App from '../../App';

export function AppWithRouter() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Страница авторизации */}
          <Route
            path="/auth"
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthPage onAuthSuccess={() => window.location.href = '/'} />
              </ProtectedRoute>
            }
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
