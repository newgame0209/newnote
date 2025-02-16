import React, { useState, useCallback, useEffect } from 'react';
import { Grid, List, Calendar, Filter, Settings, Trash2, Plus } from 'lucide-react';
import { AnimatedText } from "@/components/ui/animated-text";
import { NewNoteModal } from "@/components/NewNoteModal";
import { DeleteNoteDialog } from "@/components/DeleteNoteDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useNavigate } from "react-router-dom";
import { useNotes } from "@/contexts/NoteContext";
import { Note, CreateNoteData } from "@/types/note";
import { getDisplayCategory } from '@/types/categories';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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
  const [activeTab, setActiveTab] = useState<'note' | 'memo'>('note');
  const [activeCategory, setActiveCategory] = useState<'all' | 'work' | 'study' | 'private'>('all');
  const [activeSort, setActiveSort] = useState<'newest' | 'oldest'>('newest');
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
        case 'note':
          const mainCategoryCompare = a.main_category.localeCompare(b.main_category);
          if (mainCategoryCompare !== 0) return mainCategoryCompare;
          return a.sub_category.localeCompare(b.sub_category);
        
        case 'memo':
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
            {/* メインタブ */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'note' | 'memo')} className="w-full">
              <TabsList className="w-full justify-start h-12 bg-white">
                <TabsTrigger 
                  value="note" 
                  className="flex-1 h-full border-b-2 data-[state=inactive]:border-transparent data-[state=active]:border-[#232B3A] data-[state=active]:text-[#232B3A] data-[state=inactive]:text-gray-500 data-[state=active]:font-semibold transition-colors"
                >
                  ノート
                </TabsTrigger>
                <TabsTrigger 
                  value="memo" 
                  className="flex-1 h-full border-b-2 data-[state=inactive]:border-transparent data-[state=active]:border-[#232B3A] data-[state=active]:text-[#232B3A] data-[state=inactive]:text-gray-500 data-[state=active]:font-semibold transition-colors"
                >
                  メモ
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* サブタブとビュー切り替え */}
            <div className="flex gap-4 items-center">
              <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as 'all' | 'work' | 'study' | 'private')} className="flex-1">
                <TabsList className="bg-white border border-gray-200">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white"
                  >
                    すべて
                  </TabsTrigger>
                  <TabsTrigger 
                    value="work"
                    className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white"
                  >
                    仕事
                  </TabsTrigger>
                  <TabsTrigger 
                    value="study"
                    className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white"
                  >
                    勉強
                  </TabsTrigger>
                  <TabsTrigger 
                    value="private"
                    className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white"
                  >
                    プライベート
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Tabs value={activeSort} onValueChange={(value) => setActiveSort(value as 'newest' | 'oldest')} className="flex-1">
                <TabsList className="bg-white border border-gray-200">
                  <TabsTrigger 
                    value="newest"
                    className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white"
                  >
                    新しい順
                  </TabsTrigger>
                  <TabsTrigger 
                    value="oldest"
                    className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white"
                  >
                    古い順
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-start mt-6">
              <button
                onClick={() => setIsNewNoteModalOpen(true)}
                className="w-32 flex items-center justify-center gap-2 rounded-md bg-[#232B3A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f3a4f] transition-colors"
              >
                <Plus className="w-4 h-4" />
                新規作成
              </button>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {getSortedNotes().map((note) => (
                renderNoteCard(note)
              ))}
            </div>
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
