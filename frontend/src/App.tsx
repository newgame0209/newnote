/**
 * @docs
 * アプリケーションのルートコンポーネント
 */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import { NoteEditor } from './components/NoteEditor';
import { NoteProvider } from './contexts/NoteContext';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <NoteProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/edit/:noteId" element={<NoteEditor />} />
          </Routes>
        </Router>
      </NoteProvider>
    </SettingsProvider>
  );
}

export default App;
