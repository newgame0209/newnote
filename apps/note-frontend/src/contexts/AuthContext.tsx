import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import authApi from '@/api/authApi';

/**
 * @docs
 * 認証状態を管理するコンテキスト
 * 
 * ユーザーのログイン状態、認証情報の管理、ログイン/ログアウト機能を提供する
 */

// ユーザー情報の型定義
interface User {
  id: number;
  email: string;
  nickname: string;
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
  googleLogin: () => Promise<void>;
  handleGoogleCallback: (code: string) => Promise<void>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// APIのベースURL
const API_URL = import.meta.env.VITE_API_URL || 'https://newnote-backend.onrender.com';

/**
 * 認証プロバイダーコンポーネント
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // トークンをヘッダーに設定するAxiosインスタンス
  const authAxios = axios.create({
    baseURL: API_URL,
  });

  // リクエストインターセプター: トークンをヘッダーに追加
  authAxios.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // レスポンスインターセプター: 認証エラー処理
  authAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // 401エラーでリフレッシュトークンが存在し、リトライフラグがない場合
      if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // トークンのリフレッシュを試みる
          const newToken = await authApi.refreshToken(refreshToken);
          
          localStorage.setItem('token', newToken);
          setToken(newToken);
          
          // 新しいトークンでリクエストを再試行
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // リフレッシュに失敗した場合はログアウト
          logout();
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  /**
   * 認証状態を確認
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    if (!token) {
      setLoading(false);
      return false;
    }

    try {
      setLoading(true);
      const userData = await authApi.getUserInfo(token);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('認証確認に失敗しました', error);
      // トークンが無効な場合はログアウト
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        logout();
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 初回レンダリング時に認証状態を確認
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * ログイン処理
   */
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(email, password);
      const { access_token, refresh_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      setToken(access_token);
      setRefreshToken(refresh_token);
      setUser(userData);
      
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'ログインに失敗しました';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google認証によるログイン
   */
  const googleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const authUrl = await authApi.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      let errorMessage = 'Google認証の開始に失敗しました';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  /**
   * Google認証コールバック処理
   */
  const handleGoogleCallback = async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.googleCallback(code);
      const { access_token, refresh_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      setToken(access_token);
      setRefreshToken(refresh_token);
      setUser(userData);
      
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'Google認証に失敗しました';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ユーザー登録処理
   */
  const register = async (email: string, password: string, nickname: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await authApi.register(email, password, nickname);
      // 登録成功後、自動的にログイン
      await login(email, password);
    } catch (error: any) {
      let errorMessage = 'ユーザー登録に失敗しました';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ログアウト処理
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    navigate('/login');
  };

  /**
   * エラーをクリア
   */
  const clearError = () => {
    setError(null);
  };

  // Google認証のコールバックURLからコードを取得して処理
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    
    if (location.pathname === '/auth/google/callback' && code) {
      handleGoogleCallback(code);
    }
  }, [location]);

  // コンテキスト値
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    token,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
    checkAuth,
    googleLogin,
    handleGoogleCallback
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 認証コンテキストを使用するためのカスタムフック
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
