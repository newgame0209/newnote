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

function App() {
  return (
    <SettingsProvider>
      <NoteProvider>
        <MemoProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/edit/:noteId" element={<NoteEditor />} />
              <Route path="/memo/edit/:memoId" element={<MemoEditor />} />
            </Routes>
          </Router>
        </MemoProvider>
      </NoteProvider>
    </SettingsProvider>
  );
}

export default App;
