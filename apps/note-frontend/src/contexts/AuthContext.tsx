import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginData, RegisterData } from '@/types/auth';
import * as AuthApi from '@/api/auth';

/**
 * @docs
 * 認証に関連する状態とメソッドを提供するコンテキスト型定義
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ローカルストレージのキー
const TOKEN_KEY = 'note_app_token';
const USER_KEY = 'note_app_user';

/**
 * @docs
 * 認証状態を管理するプロバイダーコンポーネント
 * 
 * @component
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 初期化時にローカルストレージから認証情報を読み込む
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          
          // オプション: トークンの有効性を検証するためのAPIコール
          try {
            const currentUser = await AuthApi.getCurrentUser(token);
            setUser(currentUser);
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
          } catch (verifyError) {
            // トークンが無効な場合はログアウト
            console.error('認証トークンが無効です:', verifyError);
            logout();
          }
        }
      } catch (err) {
        console.error('認証情報の読み込みエラー:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  /**
   * ユーザーログイン処理
   * note-backendとmemo-backendの両方にログイン
   */
  const login = async (data: LoginData): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // ノートバックエンドにログイン
      const noteResponse = await AuthApi.loginUser(data);
      
      // メモバックエンドにも同じ認証情報でログイン
      try {
        await AuthApi.loginUserMemo(data);
      } catch (memoErr) {
        console.warn('メモバックエンドへのログインに失敗しましたが、処理を続行します:', memoErr);
      }
      
      // 認証成功時の処理
      const { user, token } = noteResponse;
      
      // ローカルストレージに保存
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // 状態を更新
      setUser(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('ログイン処理中に予期しないエラーが発生しました');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * ユーザー登録処理
   * note-backendとmemo-backendの両方に登録
   */
  const register = async (data: RegisterData): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // ノートバックエンドに登録
      const noteResponse = await AuthApi.registerUser(data);
      
      // メモバックエンドにも同じ情報で登録
      try {
        await AuthApi.registerUserMemo(data);
      } catch (memoErr) {
        console.warn('メモバックエンドへの登録に失敗しましたが、処理を続行します:', memoErr);
      }
      
      // 登録成功時の処理
      const { user, token } = noteResponse;
      
      // ローカルストレージに保存
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // 状態を更新
      setUser(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('ユーザー登録処理中に予期しないエラーが発生しました');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * ログアウト処理
   * ローカルストレージと状態をクリア
   */
  const logout = () => {
    // ローカルストレージからトークンを削除
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // 状態をリセット
    setUser(null);
    setError(null);
  };
  
  /**
   * エラー状態をクリアする
   */
  const clearError = () => {
    setError(null);
  };
  
  // コンテキスト内で必要な場合は、直接localStorage.getItem(TOKEN_KEY)を使用
  
  /**
   * Google認証コードを使ってログイン处理
   * note-backendとmemo-backendの両方にログイン
   */
  const loginWithGoogle = async (code: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // ノートバックエンドにGoogle認証コードを送信
      const noteResponse = await AuthApi.loginWithGoogleNote(code);
      
      // メモバックエンドにも同じ認証コードでログイン
      try {
        await AuthApi.loginWithGoogleMemo(code);
      } catch (memoErr) {
        console.warn('メモバックエンドへのGoogleログインに失敗しましたが、処理を続行します:', memoErr);
      }
      
      // 認証成功時の処理
      const { user, token } = noteResponse;
      
      // ローカルストレージに保存
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // 状態を更新
      setUser(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Googleログイン処理中に予期しないエラーが発生しました');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // コンテキスト値の作成
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    clearError
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * @docs
 * 認証コンテキストを使用するためのカスタムフック
 * 
 * @returns 認証コンテキストの状態とメソッド
 * @throws Error - AuthProviderの外部で使用された場合
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * JWT認証トークンを取得するユーティリティ関数
 * 他のAPIコールで使用するためのヘルパー
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
