/**
 * @docs
 * アプリケーションのルートコンポーネント
 */
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import { NoteEditor } from './components/NoteEditor';
import MemoEditor from './components/MemoEditor/MemoEditor';
import { NoteProvider } from './contexts/NoteContext';
import { MemoProvider } from './contexts/MemoContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <SettingsProvider>
        <AuthProvider>
          <NoteProvider>
            <MemoProvider>
              <Routes>
                {/* 認証ルート */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* 保護されたルート */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/edit/:noteId" element={<NoteEditor />} />
                  <Route path="/memo/edit/:memoId" element={<MemoEditor />} />
                </Route>
              </Routes>
            </MemoProvider>
          </NoteProvider>
        </AuthProvider>
      </SettingsProvider>
    </Router>
  );
}

export default App;
