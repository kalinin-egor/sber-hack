import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ConfirmationForm } from './ConfirmationForm';

type AuthStep = 'login' | 'register' | 'confirm';

interface AuthPageProps {
  onAuthSuccess?: () => void;
  initialStep?: AuthStep;
}

export function AuthPage({ onAuthSuccess, initialStep = 'login' }: AuthPageProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>(initialStep);
  const [tempToken, setTempToken] = useState<string>('');

  const handleLoginSuccess = () => {
    onAuthSuccess?.();
  };

  const handleRegisterSuccess = (token: string) => {
    setTempToken(token);
    setCurrentStep('confirm');
  };

  const handleConfirmationSuccess = () => {
    // После подтверждения регистрации переходим к логину
    setCurrentStep('login');
    // Можно показать уведомление об успешной регистрации
  };

  const handleSwitchToRegister = () => {
    setCurrentStep('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentStep('login');
  };

  const handleBackToRegister = () => {
    setCurrentStep('register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 relative overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Контент */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {currentStep === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onSwitchToRegister={handleSwitchToRegister}
                />
              </motion.div>
            )}

            {currentStep === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm
                  onSuccess={handleRegisterSuccess}
                  onSwitchToLogin={handleSwitchToLogin}
                />
              </motion.div>
            )}

            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <ConfirmationForm
                  tempToken={tempToken}
                  onSuccess={handleConfirmationSuccess}
                  onBack={handleBackToRegister}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Подвал */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-0 right-0 text-center z-10"
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 mx-auto max-w-md shadow-lg border">
          <p className="text-sm text-muted-foreground">
            Анализатор аудио - Система авторизации
          </p>
        </div>
      </motion.div>
    </div>
  );
}
