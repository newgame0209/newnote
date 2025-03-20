import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Grid, List, Calendar, Filter, Settings, Trash2, Plus, FileText, LogOut } from 'lucide-react';
import { AnimatedText } from "@/components/ui/animated-text";
import { NewNoteModal } from "@/components/NewNoteModal";
import MemoModal from "@/components/MemoModal";
import { DeleteNoteDialog } from "@/components/DeleteNoteDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useNavigate } from "react-router-dom";
import { useNotes } from "@/contexts/NoteContext";
import { useMemos } from "@/contexts/MemoContext";
import { useAuth } from "@/contexts/AuthContext";
import { Note, CreateNoteData } from "@/types/note";
import { Memo, CreateMemoData } from "@/types/memo";
import { getDisplayCategory } from '@/types/categories';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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

interface Memo {
  id: number;
  title: string;
  mainCategory: string;
  subCategory: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = React.useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [noteToDelete, setNoteToDelete] = React.useState<{ id: string; title: string } | null>(null);
  const [memoToDelete, setMemoToDelete] = React.useState<{ id: number; title: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'note' | 'memo'>('note');
  const [activeCategory, setActiveCategory] = useState<'all' | 'work' | 'study' | 'personal'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const { notes, addNote, deleteNote, fetchNotes, loading: noteLoading, error: noteError } = useNotes();
  const { memos, addMemo, deleteMemo, fetchMemos, loading: memoLoading, error: memoError } = useMemos();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleAddNote = useCallback(async (noteData: CreateNoteData) => {
    try {
      const newNote = await addNote(noteData);
      setIsNewNoteModalOpen(false);
      navigate(`/edit/${newNote.id}`);
    } catch (error) {
      console.error('ノートの作成に失敗しました:', error);
    }
  }, [addNote, navigate]);

  const handleMemoCreate = useCallback(async (data: CreateMemoData) => {
    try {
      const newMemo = await addMemo(data);
      setIsMemoModalOpen(false);
      navigate(`/memo/edit/${newMemo.id}`);
    } catch (error) {
      console.error('メモの作成に失敗しました:', error);
    }
  }, [addMemo, navigate]);

  const handleDeleteClick = useCallback((id: string, title: string) => {
    setNoteToDelete({ id, title });
    setIsDeleteDialogOpen(true);
  }, []);

  const handleMemoDeleteClick = useCallback((id: number, title: string) => {
    setMemoToDelete({ id, title });
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (activeTab === 'note' && noteToDelete) {
      deleteNote(noteToDelete.id);
      setNoteToDelete(null);
    } else if (activeTab === 'memo' && memoToDelete) {
      deleteMemo(memoToDelete.id);
      setMemoToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  }, [activeTab, deleteNote, deleteMemo, noteToDelete, memoToDelete]);

  const sortedNotes = useMemo(() => {
    let filtered = notes;
    if (activeCategory !== 'all') {
      filtered = notes.filter(note => note.main_category === activeCategory);
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });
  }, [notes, activeCategory, sortBy]);

  const sortedMemos = useMemo(() => {
    let filtered = memos;
    if (activeCategory !== 'all') {
      filtered = memos.filter(memo => memo.mainCategory === activeCategory);
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });
  }, [memos, activeCategory, sortBy]);

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

  const handleMemoClick = useCallback((memo: Memo) => {
    navigate(`/memo/edit/${memo.id}`);
  }, [navigate]);

  const renderMemoCard = useCallback((memo: Memo) => (
    <div
      key={memo.id}
      className="group relative bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleMemoClick(memo)}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{memo.title || '無題'}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMemoDeleteClick(memo.id, memo.title);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
        >
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>
      <div className="mt-2 flex items-center text-sm text-gray-500">
        {memo.mainCategory ? (
          <>
            <span>{getDisplayCategory(memo.mainCategory)}</span>
            {memo.subCategory && (
              <>
                <span className="mx-2">•</span>
                <span>{getDisplayCategory(memo.subCategory)}</span>
              </>
            )}
          </>
        ) : (
          <span>未分類</span>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        {new Date(memo.createdAt).toLocaleDateString('ja-JP')}
      </div>
    </div>
  ), [handleMemoClick, handleMemoDeleteClick]);

  useEffect(() => {
    fetchNotes();
    fetchMemos();
  }, []);

  const deleteTarget = activeTab === 'note' ? noteToDelete : memoToDelete;

  // カードの最大表示数を定義
  const MAX_CARDS_MOBILE = 3;
  const MAX_CARDS_DESKTOP = 6;
  
  // 画面幅に基づいて最大表示数を決定
  const [maxCards, setMaxCards] = useState(window.innerWidth < 640 ? MAX_CARDS_MOBILE : MAX_CARDS_DESKTOP);

  // 画面幅の変更を監視
  useEffect(() => {
    const handleResize = () => {
      setMaxCards(window.innerWidth < 640 ? MAX_CARDS_MOBILE : MAX_CARDS_DESKTOP);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // ソート済みのノートとメモから表示用のデータを制限
  const displayNotes = sortedNotes.slice(0, maxCards);
  const displayMemos = sortedMemos.slice(0, maxCards);

  // 上限に達したかどうかのチェック
  const isNoteLimitReached = sortedNotes.length >= maxCards;
  const isMemoLimitReached = sortedMemos.length >= maxCards;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('ログアウト中にエラーが発生しました:', error);
    }
  };

  // 初回表示時のようこそメッセージ
  React.useEffect(() => {
    // localStorageを使って、すでにメッセージを表示したかどうかを確認
    const hasShownWelcome = localStorage.getItem('hasShownWelcome');
    
    if (!hasShownWelcome && currentUser) {
      const userName = currentUser.displayName || ''; 
      const welcomeMessage = userName ? 
        `ようこそ、${userName}さん！ノートやメモを作成してみましょう` : 
        'ようこそ！ノートやメモを作成してみましょう';
        
      // 少し遅延させてトーストを表示（ページのロードが完了してから）
      setTimeout(() => {
        toast.show(welcomeMessage, { 
          variant: 'info',
          duration: 5000 
        });
      }, 1000);
      
      // 表示済みとしてマーク
      localStorage.setItem('hasShownWelcome', 'true');
    }
  }, [currentUser, toast]);

  return (
    <div className="min-h-full">
      <header className="bg-[#232B3A] shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <AnimatedText
              text="しゃべるノート"
              textClassName="text-2xl sm:text-3xl font-bold text-white"
              underlineGradient="from-white via-gray-300 to-white"
              underlineHeight="h-0.5"
              underlineOffset="-bottom-1"
              duration={0.3}
              delay={0.1}
            />
          </h1>
          <div className="flex items-center space-x-4 max-sm:ml-4">
            {currentUser?.displayName && (
              <span className="text-white max-sm:text-sm">こんにちは、{currentUser.displayName}さん</span>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={handleLogout}
              className="text-white hover:text-gray-200 transition-colors flex items-center gap-1"
              title="ログアウト"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-sm">ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pb-20">
        <div className="mx-auto max-w-7xl py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
            {/* メインタブ */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'note' | 'memo')} className="w-full">
              <TabsList className="w-full justify-start h-10 sm:h-12 bg-white">
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

            {/* サブタブ */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 w-full justify-between">
                <button
                  onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="max-sm:text-xs">{sortBy === 'newest' ? '新しい順' : '古い順'}</span>
                </button>
              </div>

              <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as 'all' | 'work' | 'study' | 'personal')} className="w-full">
                <TabsList className="bg-white border border-gray-200 max-sm:flex max-sm:overflow-x-auto max-sm:whitespace-nowrap max-sm:p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white max-sm:text-sm max-sm:flex-shrink-0">
                    すべて
                  </TabsTrigger>
                  <TabsTrigger value="work" className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white max-sm:text-sm max-sm:flex-shrink-0">
                    仕事
                  </TabsTrigger>
                  <TabsTrigger value="study" className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white max-sm:text-sm max-sm:flex-shrink-0">
                    学習
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="data-[state=active]:bg-[#232B3A] data-[state=active]:text-white max-sm:text-sm max-sm:flex-shrink-0">
                    プライベート
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* ノート/メモ一覧 */}
            <div className="mt-6">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeTab === 'note' ? (
                  displayNotes.map(note => renderNoteCard(note))
                ) : (
                  displayMemos.map(memo => renderMemoCard(memo))
                )}
              </div>
              {/* カード数が上限に達した場合の警告メッセージ */}
              {((activeTab === 'note' && isNoteLimitReached) || 
                (activeTab === 'memo' && isMemoLimitReached)) && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  {`${activeTab === 'note' ? 'ノート' : 'メモ'}は最大${maxCards}件まで作成できます`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 新規作成ボタン */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => activeTab === 'note' ? setIsNewNoteModalOpen(true) : setIsMemoModalOpen(true)}
            disabled={activeTab === 'note' ? isNoteLimitReached : isMemoLimitReached}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-[#232B3A] text-white shadow-lg hover:bg-[#232B3A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              activeTab === 'note' 
                ? (isNoteLimitReached ? "ノートは最大" + maxCards + "件まで作成できます" : "ノートを作成")
                : (isMemoLimitReached ? "メモは最大" + maxCards + "件まで作成できます" : "メモを作成")
            }
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </main>

      <NewNoteModal
        open={isNewNoteModalOpen}
        onOpenChange={setIsNewNoteModalOpen}
        onNoteCreate={handleAddNote}
      />

      <MemoModal
        open={isMemoModalOpen}
        onOpenChange={setIsMemoModalOpen}
        onMemoCreate={handleMemoCreate}
      />

      <DeleteNoteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={() => {
          if (deleteTarget) {
            if (activeTab === 'note') {
              handleConfirmDelete();
            } else {
              handleConfirmDelete();
            }
            setIsDeleteDialogOpen(false);
          }
        }}
        noteTitle={deleteTarget?.title || ''}
        type={activeTab}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
