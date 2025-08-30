import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../stores/AuthContext';

interface ConfirmationFormProps {
  tempToken: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function ConfirmationForm({ tempToken, onSuccess, onBack }: ConfirmationFormProps) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const { state, confirmRegistration, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmationCode) {
      return;
    }

    try {
      await confirmRegistration(tempToken, confirmationCode);
      onSuccess?.();
    } catch (error) {
      // Ошибка обрабатывается в контексте
    }
  };

  const handleInputChange = (value: string) => {
    setConfirmationCode(value);
    if (state.error) {
      clearError();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full w-fit"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Подтверждение email
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Мы отправили код подтверждения на ваш email. Введите его ниже.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {state.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="confirmationCode" className="text-sm font-medium">
                Код подтверждения
              </Label>
              <Input
                id="confirmationCode"
                type="text"
                value={confirmationCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Введите код из email"
                className="h-12 text-center text-lg font-mono tracking-widest"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                Проверьте папку "Спам", если письмо не пришло
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium text-base shadow-lg"
                disabled={state.isLoading || !confirmationCode}
              >
                {state.isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Подтвердить
                  </>
                )}
              </Button>

              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="w-full h-12"
                  disabled={state.isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад к регистрации
                </Button>
              )}
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4 border-t"
          >
            <p className="text-sm text-muted-foreground">
              Не получили код?{' '}
              <button
                onClick={() => {
                  // Здесь можно добавить логику повторной отправки кода
                  console.log('Resend code');
                }}
                className="text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors"
              >
                Отправить повторно
              </button>
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
