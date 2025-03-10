/**
 * @docs
 * アプリケーションのルートコンポーネント
 */

import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import { NoteEditor } from './components/NoteEditor';
import MemoEditor from './components/MemoEditor/MemoEditor';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import GoogleCallback from './pages/auth/GoogleCallback';
import { NoteProvider } from './contexts/NoteContext';
import { MemoProvider } from './contexts/MemoContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NoteProvider>
          <MemoProvider>
            <Router>
              <Routes>
                {/* 公開ルート - 認証なしでアクセス可能 */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/google/callback" element={<GoogleCallback />} />
                
                {/* ホームページは認証なしでもアクセス可能 */}
                <Route path="/" element={<Home />} />
                
                {/* 保護されたルート - 認証が必要 */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/edit/:noteId" element={<NoteEditor />} />
                  <Route path="/memo/edit/:memoId" element={<MemoEditor />} />
                </Route>
              </Routes>
            </Router>
          </MemoProvider>
        </NoteProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
