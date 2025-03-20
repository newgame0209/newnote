/**
 * @docs
 * アプリケーションのルートコンポーネント
 */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import { NoteEditor } from './components/NoteEditor';
import MemoEditor from './components/MemoEditor/MemoEditor';
import { NoteProvider } from './contexts/NoteContext';
import { MemoProvider } from './contexts/MemoContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import { ToastContainer } from './components/ui/toast';
import NoteViewerTest from './components/test/NoteViewerTest';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NoteProvider>
          <MemoProvider>
            <ToastContainer>
              <Router>
                <Routes>
                  {/* 認証ページ */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* 認証が必要なページ */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } />
                  <Route path="/edit/:noteId" element={
                    <ProtectedRoute>
                      <NoteEditor />
                    </ProtectedRoute>
                  } />
                  <Route path="/memo/edit/:memoId" element={
                    <ProtectedRoute>
                      <MemoEditor />
                    </ProtectedRoute>
                  } />
                  
                  {/* テストページ - 認証不要 */}
                  <Route path="/test-viewer" element={<NoteViewerTest />} />
                </Routes>
              </Router>
            </ToastContainer>
          </MemoProvider>
        </NoteProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
