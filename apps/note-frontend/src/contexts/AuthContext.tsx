import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, AuthUser } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  handleAuthCallback: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// バックエンドAPIのベースURL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // セッションの確認
    const checkSession = async () => {
      try {
        // バックエンドのセッション情報を取得
        const response = await axios.get(`${API_BASE_URL}/api/auth/user`, {
          withCredentials: true
        });
        
        if (response.data.authenticated) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('セッション確認エラー:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // バックエンドのログインAPIを呼び出し
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        navigate('/');
        return { error: null };
      } else {
        return { error: response.data.error || 'ログインに失敗しました' };
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      return { error: error.response?.data?.error || 'ログインに失敗しました' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // バックエンドの登録APIを呼び出し
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        { email, password },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('確認メールを送信しました。メールを確認してアカウントを有効化してください。');
        return { error: null };
      } else {
        return { error: response.data.error || '登録に失敗しました' };
      }
    } catch (error: any) {
      console.error('登録エラー:', error);
      return { error: error.response?.data?.error || '登録に失敗しました' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // バックエンドのログアウトAPIを呼び出し
      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Googleログイン用のリダイレクトURLを取得
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      // リダイレクトURLがある場合は、そのURLにリダイレクト
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Google認証エラー:', error);
    }
  };

  const handleAuthCallback = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // URLからcodeとprovider_tokenを取得
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (!code) {
        console.error('認証コードが見つかりません');
        return false;
      }
      
      // Supabaseでセッション交換
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error || !data.session) {
        console.error('セッション交換エラー:', error);
        return false;
      }
      
      // バックエンドにトークンを送信してセッションを確立
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/google-callback`,
        { 
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          provider_token: data.session.provider_token,
          user: data.session.user
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        console.error('バックエンド認証エラー:', response.data.error);
        return false;
      }
    } catch (error) {
      console.error('認証コールバックエラー:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        handleAuthCallback
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
