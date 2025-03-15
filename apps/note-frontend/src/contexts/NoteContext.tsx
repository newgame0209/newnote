import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Note, CreateNoteData } from '@/types/note';
import noteApi from '@/api/notes';

// デバッグ用のログ関数
const logDebug = (message: string, data?: any) => {
  console.log(`[Note Context Debug] ${message}`, data || '');
};

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

const NoteContext = createContext<NoteContextType | null>(null);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addNote = async (noteData: CreateNoteData): Promise<Note> => {
    logDebug('ノート追加開始', noteData);
    setLoading(true);
    setError(null);
    try {
      const newNote = await noteApi.createNote(noteData);
      logDebug('ノート追加成功', newNote);
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      logDebug('ノート追加エラー', err);
      const errorMessage = err instanceof Error ? err.message : 'ノートの作成中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string): Promise<void> => {
    logDebug('ノート削除開始', { id });
    setLoading(true);
    setError(null);
    try {
      await noteApi.deleteNote(id);
      logDebug('ノート削除成功', { id });
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      logDebug('ノート削除エラー', err);
      const errorMessage = err instanceof Error ? err.message : 'ノートの削除中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (id: string, data: Partial<CreateNoteData>): Promise<Note> => {
    logDebug('ノート更新開始', { id, data });
    setLoading(true);
    setError(null);
    try {
      const updatedNote = await noteApi.updateNote(id, data);
      logDebug('ノート更新成功', updatedNote);
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      logDebug('ノート更新エラー', err);
      const errorMessage = err instanceof Error ? err.message : 'ノートの更新中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchNote = async (id: string): Promise<Note> => {
    logDebug('ノート取得開始', { id });
    setLoading(true);
    setError(null);
    try {
      const note = await noteApi.getNote(id);
      logDebug('ノート取得成功', note);
      return note;
    } catch (err) {
      logDebug('ノート取得エラー', err);
      const errorMessage = err instanceof Error ? err.message : 'ノートの取得中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = useCallback(async (): Promise<void> => {
    // トークンがない場合は処理をスキップ
    const token = localStorage.getItem('token');
    if (!token) {
      logDebug('トークンがないため、ノート一覧取得をスキップ');
      return;
    }
    
    logDebug('ノート一覧取得開始');
    setLoading(true);
    setError(null);
    try {
      const fetchedNotes = await noteApi.getNotes();
      logDebug('ノート一覧取得成功', { count: fetchedNotes.length });
      setNotes(fetchedNotes);
    } catch (err) {
      logDebug('ノート一覧取得エラー', err);
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
  if (context === null) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}
