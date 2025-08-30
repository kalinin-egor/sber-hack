import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthTokens, UserProfile, LoginResponse } from '../../shared/types/auth';
import { AuthService } from '../../application/services/AuthService';

// Типы действий
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: LoginResponse }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_TOKENS'; payload: AuthTokens }
  | { type: 'CLEAR_ERROR' };

// Начальное состояние
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Редьюсер
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'UPDATE_TOKENS':
      return {
        ...state,
        tokens: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Контекст
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<string>;
  confirmRegistration: (tempToken: string, confirmationCode: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = new AuthService();

  // Проверка сохраненных токенов при загрузке
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const tokens = authService.getTokens();
        if (tokens && authService.isTokenValid(tokens.access_token)) {
          // Попробуем получить данные пользователя из localStorage
          const savedUser = localStorage.getItem('user_profile');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            dispatch({ 
              type: 'LOGIN_SUCCESS', 
              payload: { tokens, user } 
            });
          } else {
            // Если нет данных пользователя, очищаем токены
            authService.clearTokens();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // Токены недействительны, очищаем
          authService.clearTokens();
          localStorage.removeItem('user_profile');
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        // При ошибке очищаем все данные
        authService.clearTokens();
        localStorage.removeItem('user_profile');
        dispatch({ type: 'LOGOUT' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const loginResponse = await authService.login({ email, password });
      
      // Сохраняем токены в новом формате
      const tokens = {
        access_token: loginResponse.access_token,
        refresh_token: loginResponse.refresh_token,
        token_type: 'Bearer',
        expires_in: 3600
      };
      authService.saveTokens(tokens);
      
      // Сохраняем данные пользователя в localStorage
      localStorage.setItem('user_profile', JSON.stringify(loginResponse.user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { 
        tokens, 
        user: loginResponse.user 
      }});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка входа';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const registerResponse = await authService.register({ email, username, password });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return registerResponse.temp_token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка регистрации';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const confirmRegistration = async (tempToken: string, confirmationCode: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await authService.confirmRegistration({
        temp_token: tempToken,
        confirmation_code: confirmationCode,
      });
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка подтверждения';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      localStorage.removeItem('user_profile');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // В любом случае очищаем локальное состояние
      localStorage.removeItem('user_profile');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    state,
    login,
    register,
    confirmRegistration,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования контекста
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
