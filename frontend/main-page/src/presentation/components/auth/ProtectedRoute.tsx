import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/AuthContext';
import { motion } from 'motion/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { state } = useAuth();
  const location = useLocation();

  // Если загружается состояние аутентификации, показываем загрузку
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg text-muted-foreground">Загрузка...</p>
        </motion.div>
      </div>
    );
  }

  // Если требуется аутентификация, но пользователь не авторизован
  if (requireAuth && !state.isAuthenticated) {
    // Сохраняем текущий путь для редиректа после входа
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Если пользователь уже авторизован и пытается попасть на страницу авторизации
  if (!requireAuth && state.isAuthenticated) {
    // Получаем путь, с которого пользователь был перенаправлен, или переходим на главную
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
