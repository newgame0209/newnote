import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Note {
  id: string;
  title: string;
  mainCategory: string;
  subCategory: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  size: string;
  orientation: string;
}

interface NoteContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  deleteNote: (id: string) => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      ...noteData,
      createdAt: new Date().toLocaleDateString('ja-JP'),
      updatedAt: new Date().toLocaleDateString('ja-JP')
    };

    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <NoteContext.Provider value={{ notes, addNote, deleteNote }}>
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
