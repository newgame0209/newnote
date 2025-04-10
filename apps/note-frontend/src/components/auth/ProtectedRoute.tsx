import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * 認証済みユーザーのみがアクセスできるルートコンポーネント
 * 認証されていないユーザーはログインページにリダイレクトされる
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // 読み込み中の場合は何も表示しない
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 認証されていない場合はログインページにリダイレクト
  if (!currentUser) {
    // 現在のパスをstateとして保存してリダイレクト
    // ログイン後に元のページに戻れるようにする
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>;
} 