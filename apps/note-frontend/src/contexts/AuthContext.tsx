import { createContext, useState, useEffect, useContext } from 'react';
import authApi from '../api/authApi';
import { useNavigate, useLocation } from 'react-router-dom';

// ユーザー型定義
export type User = {
  id: string;
  email: string;
  nickname: string;
};

// 認証状態の型定義
export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
};

// 認証コンテキストの型定義
export type AuthContextType = {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  googleLogin: () => Promise<void>;
  googleCallback: (code: string) => Promise<void>;
  clearError: () => void;
};

// デフォルト値
const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

// コンテキスト作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    ...defaultAuthState,
    loading: true
  });
  const navigate = useNavigate();
  const location = useLocation();

  // 初回マウント時に認証状態を確認
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setAuth({
            ...defaultAuthState,
            loading: false
          });
          return;
        }

        const result = await checkAuth();
        if (!result) {
          // 認証失敗時はトークンを削除
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
        }
      } catch (error) {
        console.error('初期認証エラー:', error);
        setAuth({
          ...defaultAuthState,
          loading: false,
          error: '認証の初期化に失敗しました'
        });
      }
    };

    initAuth();
  }, []);

  // 認証状態の確認
  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setAuth({
        ...defaultAuthState,
        loading: false,
      });
      return false;
    }

    try {
      console.log('認証確認開始...');
      const userData = await authApi.getUserInfo(token);
      
      console.log('認証確認成功:', userData);
      
      setAuth({
        isAuthenticated: true,
        user: userData,
        loading: false,
        error: null,
      });
      
      return true;
    } catch (error: any) {
      console.error('認証確認エラー:', error);
      
      // トークンが無効な場合はログアウト処理
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
      }
      
      setAuth({
        ...defaultAuthState,
        loading: false,
        error: '認証に失敗しました'
      });
      
      return false;
    }
  };

  // ログイン処理
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      
      // トークンを保存
      localStorage.setItem('token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      // ユーザー情報を取得して状態を更新
      const userData = await authApi.getUserInfo(response.access_token);
      
      setAuth({
        isAuthenticated: true,
        user: userData,
        loading: false,
        error: null
      });

      navigate('/');
    } catch (error: any) {
      console.error('ログインエラー:', error);
      setAuth({
        ...auth,
        error: error.message || 'ログインに失敗しました'
      });
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
      const response = await authApi.register(email, password, nickname);
      
      // 登録成功後、自動的にログイン
      await login(email, password);
      
      navigate('/');
    } catch (error: any) {
      console.error('登録エラー:', error);
      setAuth({
        ...auth,
        error: error.message || 'ユーザー登録に失敗しました'
      });
      throw error;
    }
  };

  // Google認証によるログイン
  const googleLogin = async () => {
    try {
      const url = await authApi.getGoogleAuthUrl();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Google認証URLの取得に失敗しました');
      }
    } catch (error: any) {
      console.error('Google認証エラー:', error);
      setAuth({
        ...auth,
        error: error.message || 'Google認証に失敗しました'
      });
    }
  };

  // Google認証コールバック処理
  const googleCallback = async (code: string) => {
    try {
      const result = await authApi.googleCallback(code);
      
      if (result && result.token) {
        localStorage.setItem('token', result.token);
        
        // ユーザー情報を取得
        const userData = await authApi.getUserInfo(result.token);
        
        setAuth({
          isAuthenticated: true,
          user: userData,
          loading: false,
          error: null,
        });
        
        // ホーム画面へリダイレクト
        navigate('/');
      } else {
        throw new Error('Google認証に失敗しました: トークンが取得できませんでした');
      }
    } catch (error: any) {
      console.error('Google認証コールバックエラー:', error);
      setAuth({
        ...auth,
        error: error.message || 'Google認証に失敗しました'
      });
    }
  };

  // Google認証のコールバックURLからコードを取得して処理
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      
      if (code && location.pathname === '/auth/google/callback') {
        await googleCallback(code);
      }
    };
    
    handleGoogleCallback();
  }, [location]);

  // エラークリア
  const clearError = () => {
    setAuth({
      ...auth,
      error: null
    });
  };

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
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
