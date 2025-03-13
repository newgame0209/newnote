/**
 * @docs
 * アプリケーションのルートコンポーネント
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import { NoteEditor } from './components/NoteEditor';
import MemoEditor from './components/MemoEditor/MemoEditor';
import { NoteProvider } from './contexts/NoteContext';
import { MemoProvider } from './contexts/MemoContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <NoteProvider>
            <MemoProvider>
              <Routes>
                {/* 認証ページ - 保護されていない */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/auth/google/callback" element={<LoginPage />} />
                
                {/* 保護されたルート */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit/:noteId"
                  element={
                    <ProtectedRoute>
                      <NoteEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/memo/edit/:memoId"
                  element={
                    <ProtectedRoute>
                      <MemoEditor />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </MemoProvider>
          </NoteProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
