import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authApi from '@/api/authApi';

/**
 * @docs
 * 認証状態を管理するコンテキスト
 * 
 * ユーザーのログイン状態、認証情報の管理、ログイン/ログアウト機能を提供する
 */

// ユーザー情報の型定義
interface User {
  id: string;
  email: string;
  name?: string;
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * 認証状態を確認
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    // トークンがない場合は何もしない
    if (!token) {
      return false;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include' as RequestCredentials,
        mode: 'cors' as RequestMode
      });
      
      if (!response.ok) {
        console.error('認証エラー:', response.status, response.statusText);
        throw new Error(`認証エラー: ${response.status}`);
      }
      
      const userData = await response.json();
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error('認証確認に失敗しました', error);
      // トークンが無効な場合はログアウト
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        logout();
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 初回レンダリング時に認証状態を確認
  useEffect(() => {
    // トークンが存在する場合のみ認証確認を行う
    if (token) {
      checkAuth();
    }
  }, [checkAuth, token]);

  /**
   * ログイン処理
   */
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include' as RequestCredentials,
        mode: 'cors' as RequestMode,
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      const { access_token, refresh_token, user: userData } = data;
      
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
      const response = await fetch(`${API_URL}/auth/google/url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include' as RequestCredentials,
        mode: 'cors' as RequestMode
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const authUrl = await response.text();
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
      const response = await fetch(`${API_URL}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include' as RequestCredentials,
        mode: 'cors' as RequestMode,
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      const { access_token, refresh_token, user: userData } = data;
      
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
  const register = async (email: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include' as RequestCredentials,
        mode: 'cors' as RequestMode,
        body: JSON.stringify({ email, password, name }),
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
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
  const logout = async () => {
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
