import { createContext, useState, useEffect, useContext } from 'react';
import authApi from '../api/authApi';
import { useNavigate, useLocation } from 'react-router-dom';

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
  loading: true,
  error: null
};

// コンテキストの作成
const AuthContext = createContext<AuthContextType | null>(null);

// プロバイダーコンポーネント
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);
  const navigate = useNavigate();
  const location = useLocation();

  // 認証状態のチェック
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuth({
          ...defaultAuthState,
          loading: false
        });
        return false;
      }

      const userData = await authApi.getUserInfo(token);
      setAuth({
        isAuthenticated: true,
        user: userData,
        loading: false,
        error: null
      });
      return true;
    } catch (error: any) {
      console.error('認証チェックエラー:', error);
      
      // トークンが無効な場合はログアウト
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      
      setAuth({
        ...defaultAuthState,
        loading: false,
        error: error.message || '認証チェックに失敗しました'
      });
      return false;
    }
  };

  // 初期認証チェック
  useEffect(() => {
    checkAuth();
  }, []);

  // ログイン処理
  const login = async (email: string, password: string) => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      const data = await authApi.login(email, password);
      
      if (!data || !data.access_token) {
        throw new Error('ログインレスポンスが不正です');
      }
      
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // ユーザー情報がレスポンスに含まれている場合はそれを使用
      if (data.user) {
        setAuth({
          isAuthenticated: true,
          user: data.user,
          loading: false,
          error: null
        });
        
        // ログイン前のページがあればそこに戻る、なければホームへ
        const from = location.state?.from?.pathname || '/';
        navigate(from);
        return;
      }
      
      // ユーザー情報が含まれていない場合は別途取得
      try {
        const userData = await authApi.getUserInfo(data.access_token);
        setAuth({
          isAuthenticated: true,
          user: userData,
          loading: false,
          error: null
        });
        
        // ログイン前のページがあればそこに戻る、なければホームへ
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      } catch (userError: any) {
        console.error('ユーザー情報取得エラー:', userError);
        // ユーザー情報取得に失敗してもログイン自体は成功しているのでホームへ
        setAuth({
          isAuthenticated: true,
          user: null,
          loading: false,
          error: null
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      setAuth(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'ログインに失敗しました'
      }));
      throw error;
    }
  };

  // ログアウト処理
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setAuth({
      ...defaultAuthState,
      loading: false
    });
    navigate('/login');
  };

  // ユーザー登録処理
  const register = async (email: string, password: string, nickname: string) => {
    try {
      console.log('登録処理開始:', { email, nickname });
      setAuth(prev => ({ ...prev, loading: true, error: null }));

      const response = await authApi.register(email, password, nickname);
      console.log('登録成功:', response);
      
      // 登録成功後、自動的にログイン
      await login(email, password);
    } catch (error: any) {
      console.error('登録エラー:', error);
      setAuth(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'ユーザー登録に失敗しました'
      }));
      throw error;
    }
  };

  // Google認証によるログイン
  const googleLogin = async () => {
    try {
      // Google認証ページへリダイレクト
      window.location.href = `${import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api'}/auth/google`;
    } catch (error: any) {
      console.error('Google認証エラー:', error);
      setAuth({
        ...auth,
        error: error.message || 'Google認証に失敗しました'
      });
      throw error;
    }
  };

  // Googleコールバック処理
  const googleCallback = async (code: string) => {
    try {
      const data = await authApi.googleCallback(code);
      
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      setAuth({
        isAuthenticated: true,
        user: data.user,
        loading: false,
        error: null
      });

      navigate('/');
    } catch (error: any) {
      console.error('Googleコールバックエラー:', error);
      setAuth({
        ...auth,
        error: error.message || 'Google認証に失敗しました'
      });
      throw error;
    }
  };

  // エラーのクリア
  const clearError = () => {
    setAuth(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{
      auth,
      login,
      logout,
      register,
      checkAuth,
      googleLogin,
      googleCallback,
      clearError
    }}>
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
