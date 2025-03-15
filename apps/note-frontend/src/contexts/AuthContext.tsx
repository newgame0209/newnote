import { createContext, useState, useContext, useEffect } from 'react';
import authApi from '../api/authApi';
import { useNavigate } from 'react-router-dom';

// デバッグ用のログ関数
const logDebug = (message: string, data?: any) => {
  console.log(`[Auth Debug] ${message}`, data || '');
};

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

// トークンを保存する関数
const saveTokens = (accessToken: string, refreshToken?: string) => {
  logDebug('トークンを保存します', { accessToken: accessToken.substring(0, 10) + '...' });
  localStorage.setItem('token', accessToken);
  
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

// トークンを取得する関数
const getToken = (): string | null => {
  const token = localStorage.getItem('token');
  logDebug('トークンを取得しました', token ? { token: token.substring(0, 10) + '...' } : 'トークンがありません');
  return token;
};

// トークンをクリアする関数
const clearTokens = () => {
  logDebug('トークンをクリアします');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);
  const navigate = useNavigate();

  // ページ読み込み時に認証状態を復元
  useEffect(() => {
    const restoreAuth = async () => {
      logDebug('認証状態を復元中...');
      const token = getToken();
      
      if (!token) {
        logDebug('トークンがないため、未認証状態で開始します');
        return;
      }

      try {
        setAuth(prev => ({ ...prev, loading: true }));
        logDebug('トークンを検証中...');
        
        // トークンがある場合はユーザー情報を取得
        const response = await authApi.checkAuth();
        logDebug('ユーザー情報を取得しました', response);
        
        // レスポンスにトークンが含まれている場合は保存
        if (response.access_token) {
          saveTokens(response.access_token, response.refresh_token);
        }
        
        setAuth({
          isAuthenticated: true,
          user: response.user,
          loading: false,
          error: null
        });
        
        logDebug('認証状態を復元しました', { user: response.user });
      } catch (error) {
        logDebug('トークン検証に失敗しました', error);
        // トークンが無効な場合はローカルストレージをクリア
        clearTokens();
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
      logDebug('ログイン開始', { email });
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authApi.login(email, password);
      logDebug('ログイン成功', response);
      
      // トークンを保存
      saveTokens(response.access_token, response.refresh_token);
      
      setAuth({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null
      });
      
      navigate('/');
    } catch (error) {
      logDebug('ログイン失敗', error);
      setAuth(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'ログインに失敗しました'
      }));
    }
  };

  const register = async (email: string, password: string, nickname: string) => {
    try {
      logDebug('ユーザー登録開始', { email, nickname });
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authApi.register(email, password, nickname);
      logDebug('ユーザー登録成功', response);
      
      // トークンを保存
      saveTokens(response.access_token, response.refresh_token);
      
      setAuth({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null
      });
      
      navigate('/');
    } catch (error) {
      logDebug('ユーザー登録失敗', error);
      setAuth(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '登録に失敗しました'
      }));
    }
  };

  const logout = () => {
    logDebug('ログアウト');
    clearTokens();
    setAuth(defaultAuthState);
    navigate('/login');
  };

  const googleLogin = async () => {
    try {
      logDebug('Google認証開始');
      window.location.href = `${import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api'}/auth/google`;
    } catch (error) {
      logDebug('Google認証失敗', error);
      setAuth(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Google認証に失敗しました'
      }));
    }
  };

  const googleCallback = async (code: string) => {
    try {
      logDebug('Googleコールバック処理開始', { code: code.substring(0, 10) + '...' });
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authApi.googleCallback(code);
      logDebug('Googleコールバック処理成功', response);
      
      // トークンを保存
      saveTokens(response.access_token, response.refresh_token);
      
      setAuth({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null
      });
      
      navigate('/');
    } catch (error) {
      logDebug('Googleコールバック処理失敗', error);
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
