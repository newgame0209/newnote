import { createContext, useState, useContext, useEffect } from 'react';
import authApi from '../api/authApi';
import { useNavigate } from 'react-router-dom';

// ユーザー型定義
interface User {
  id: string;
  email: string;
  nickname: string;
}

// 認証状態の型定義
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 認証コンテキストの型定義
interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  googleLogin: () => Promise<void>;
  googleCallback: (code: string) => Promise<void>;
  clearError: () => void;
}

// デフォルト値
const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

// コンテキストの作成
const AuthContext = createContext<AuthContextType | null>(null);

// プロバイダーコンポーネント
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);
  const navigate = useNavigate();

  const clearError = () => {
    setAuth(prev => ({ ...prev, error: null }));
  };

  const setLoading = (loading: boolean) => {
    setAuth(prev => ({ ...prev, loading }));
  };

  const setError = (error: string) => {
    setAuth(prev => ({ ...prev, error }));
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      clearError();
      const response = await authApi.login(email, password);
      setAuth(prev => ({
        ...prev,
        isAuthenticated: true,
        user: response.user
      }));
      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('ログインに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, nickname: string) => {
    try {
      setLoading(true);
      clearError();
      const response = await authApi.register(email, password, nickname);
      setAuth(prev => ({
        ...prev,
        isAuthenticated: true,
        user: response.user
      }));
      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('登録に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      clearError();
      await authApi.logout();
      setAuth(defaultAuthState);
      navigate('/login');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('ログアウトに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      clearError();
      const response = await authApi.checkAuth();
      setAuth(prev => ({
        ...prev,
        isAuthenticated: true,
        user: response.user
      }));
      return true;
    } catch (error) {
      setAuth(defaultAuthState);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      setLoading(true);
      clearError();
      await authApi.googleLogin();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Google認証に失敗しました');
      }
      setLoading(false);
    }
  };

  const googleCallback = async (code: string) => {
    try {
      setLoading(true);
      clearError();
      const response = await authApi.googleCallback(code);
      setAuth(prev => ({
        ...prev,
        isAuthenticated: true,
        user: response.user
      }));
      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Google認証に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  // 初回のみ認証チェックを実行
  useEffect(() => {
    const initialAuthCheck = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }
        await checkAuth();
      } catch (error) {
        console.error('認証チェックエラー:', error);
      }
    };
    initialAuthCheck();
  }, []); // 依存配列を空にして初回のみ実行

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        register,
        checkAuth,
        googleLogin,
        googleCallback,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
