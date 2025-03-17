import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
}

/**
 * 認証が必要なルートを保護するコンポーネント
 * ユーザーが認証されていない場合は、指定されたパスにリダイレクトする
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  redirectPath = '/login'
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 認証状態の読み込み中は何も表示しない
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 認証されていない場合はリダイレクト
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // 認証されている場合は子コンポーネントを表示
  return <Outlet />;
};

export default ProtectedRoute;
