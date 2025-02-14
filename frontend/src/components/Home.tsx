import React, { useState, useCallback, useEffect } from 'react';
import { Grid, List, Calendar, Filter, Settings, Trash2 } from 'lucide-react';
import { AnimatedText } from "@/components/ui/animated-text";
import { NewNoteModal } from "@/components/NewNoteModal";
import { DeleteNoteDialog } from "@/components/DeleteNoteDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useNavigate } from "react-router-dom";
import { useNotes } from "@/contexts/NoteContext";
import { Note, CreateNoteData } from "@/types/note";
import { getDisplayCategory } from '@/types/categories';

interface Note {
  id: string;
  title: string;
  main_category: string;
  sub_category: string;
  created_at: string;
  updated_at: string;
  type: string;
  size: string;
  orientation: string;
}

export default function Home() {
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [noteToDelete, setNoteToDelete] = React.useState<{ id: string; title: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'category' | 'date'>('category');
  const { notes, addNote, deleteNote, fetchNotes, loading, error } = useNotes();
  const navigate = useNavigate();

  const handleAddNote = useCallback(async (noteData: CreateNoteData) => {
    try {
      const newNote = await addNote(noteData);
      setIsNewNoteModalOpen(false);
      navigate(`/edit/${newNote.id}`);
    } catch (error) {
      console.error('ノートの作成に失敗しました:', error);
    }
  }, [addNote, navigate]);

  const handleDeleteClick = useCallback((id: string, title: string) => {
    setNoteToDelete({ id, title });
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
    }
  }, [deleteNote, noteToDelete]);

  const getSortedNotes = useCallback(() => {
    return [...notes].sort((a, b) => {
      switch (activeTab) {
        case 'category':
          const mainCategoryCompare = a.main_category.localeCompare(b.main_category);
          if (mainCategoryCompare !== 0) return mainCategoryCompare;
          return a.sub_category.localeCompare(b.sub_category);
        
        case 'date':
          const bDate = new Date(b.updated_at).getTime();
          const aDate = new Date(a.updated_at).getTime();
          return bDate - aDate;
        
        default:
          return 0;
      }
    });
  }, [notes, activeTab]);

  const getDisplayOrientation = (orientation: string): string => {
    return orientation === 'portrait' ? '縦向き' : '横向き';
  };

  const renderNoteCard = useCallback((note: Note) => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'text':
          return <Calendar className="w-5 h-5" />;
        case 'image':
          return <Filter className="w-5 h-5" />;
        default:
          return <Calendar className="w-5 h-5" />;
      }
    };

    return (
      <div
        key={note.id}
        className="group relative bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/edit/${note.id}`)}
      >
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(note.id, note.title);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <span>{getDisplayCategory(note.main_category)}</span>
          <span className="mx-2">•</span>
          <span>{getDisplayCategory(note.sub_category)}</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {new Date(note.updated_at).toLocaleDateString('ja-JP')}
        </div>
      </div>
    );
  }, [handleDeleteClick, navigate]);

  useEffect(() => {
    fetchNotes();
  }, []); 

  return (
    <div className="min-h-full">
      <header className="bg-[#232B3A] shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <AnimatedText
              text="しゃべるノート"
              textClassName="text-3xl font-bold text-white"
              underlineGradient="from-white via-gray-300 to-white"
              underlineHeight="h-0.5"
              underlineOffset="-bottom-1"
              duration={0.3}
              delay={0.1}
            />
          </h1>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-md bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-6">
            <div className="border-b border-gray-200 flex justify-between items-center">
              <nav className="-mb-px flex gap-8">
                <button
                  className={`py-4 px-1 text-base font-medium border-b-2 ${
                    activeTab === 'category' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('category')}
                >
                  カテゴリ
                </button>
                <button
                  className={`py-4 px-1 text-base font-medium border-b-2 ${
                    activeTab === 'date' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('date')}
                >
                  日付
                </button>
              </nav>

              <div className="flex items-center gap-2 pb-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex justify-start mt-6">
              <button
                onClick={() => setIsNewNoteModalOpen(true)}
                className="w-32 flex items-center justify-center gap-2 rounded-md bg-[#232B3A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f3a4f] transition-colors"
              >
                <span className="text-xl">+</span>
                新規作成
              </button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {getSortedNotes().map((note) => (
              renderNoteCard(note)
            ))}
          </div>
        </div>
      </main>

      <NewNoteModal
        open={isNewNoteModalOpen}
        onOpenChange={setIsNewNoteModalOpen}
        onNoteCreate={handleAddNote}
      />

      <DeleteNoteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        noteTitle={noteToDelete?.title || ''}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
