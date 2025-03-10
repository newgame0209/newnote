/**
 * @docs
 * 認証が必要なルートを保護するためのコンポーネント
 * 未認証ユーザーはログインページにリダイレクトされる
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * @docs
 * 認証が必要なルートを保護するコンポーネント
 * 
 * @component
 * @example
 * ```tsx
 * <Routes>
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/protected" element={<ProtectedComponent />} />
 *   </Route>
 * </Routes>
 * ```
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // 読み込み中は何も表示しない（または別のローディングコンポーネントを表示）
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 認証されていなければログインページにリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 認証されている場合は子ルートを表示
  return <Outlet />;
};

export default ProtectedRoute;
