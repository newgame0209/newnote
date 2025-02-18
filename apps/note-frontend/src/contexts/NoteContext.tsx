import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Note, CreateNoteData } from '@/types/note';
import * as NotesApi from '@/api/notes';

interface NoteContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  addNote: (note: CreateNoteData) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, data: Partial<CreateNoteData>) => Promise<Note>;
  fetchNote: (id: string) => Promise<Note>;
  fetchNotes: () => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addNote = async (noteData: CreateNoteData): Promise<Note> => {
    setLoading(true);
    setError(null);
    try {
      const newNote = await NotesApi.createNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ノートの作成中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await NotesApi.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ノートの削除中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (id: string, data: Partial<CreateNoteData>): Promise<Note> => {
    setLoading(true);
    setError(null);
    try {
      const updatedNote = await NotesApi.updateNote(id, data);
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ノートの更新中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchNote = async (id: string): Promise<Note> => {
    setLoading(true);
    setError(null);
    try {
      const note = await NotesApi.fetchNote(id);
      return note;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ノートの取得中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const fetchedNotes = await NotesApi.fetchNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ノート一覧の取得中にエラーが発生しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // 空の依存配列

  return (
    <NoteContext.Provider 
      value={{ 
        notes, 
        loading, 
        error, 
        addNote, 
        deleteNote,
        updateNote,
        fetchNote,
        fetchNotes
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}
