import { createContext, useState, useContext, useEffect } from 'react';
import authApi from '../api/authApi';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  nickname: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  googleCallback: (code: string) => Promise<void>;
  clearError: () => void;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);
  const navigate = useNavigate();

  // ページ読み込み時に認証状態を復元
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        setAuth(prev => ({ ...prev, loading: true }));
        // トークンがある場合はユーザー情報を取得
        const response = await authApi.checkAuth();
        setAuth({
          isAuthenticated: true,
          user: response.user,
          loading: false,
          error: null
        });
      } catch (error) {
        // トークンが無効な場合はローカルストレージをクリア
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setAuth(defaultAuthState);
      }
    };

    restoreAuth();
  }, []);

  const clearError = () => {
    setAuth(prev => ({ ...prev, error: null }));
  };

  const login = async (email: string, password: string) => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      const response = await authApi.login(email, password);
      setAuth({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null
      });
      navigate('/');
    } catch (error) {
      setAuth(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'ログインに失敗しました'
      }));
    }
  };

  const register = async (email: string, password: string, nickname: string) => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      const response = await authApi.register(email, password, nickname);
      setAuth({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null
      });
      navigate('/');
    } catch (error) {
      setAuth(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '登録に失敗しました'
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setAuth(defaultAuthState);
    navigate('/login');
  };

  const googleLogin = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api'}/auth/google`;
    } catch (error) {
      setAuth(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Google認証に失敗しました'
      }));
    }
  };

  const googleCallback = async (code: string) => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      const response = await authApi.googleCallback(code);
      setAuth({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null
      });
      navigate('/');
    } catch (error) {
      setAuth(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Google認証に失敗しました'
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        register,
        googleLogin,
        googleCallback,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
