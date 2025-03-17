import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Memo } from '../types/memo';
import { memoApi } from '../api/memoApi';

interface MemoContextType {
  currentMemo: Memo | null;
  setCurrentMemo: (memo: Memo | null) => void;
  saveMemo: (title: string, content: string, mainCategory?: string, subCategory?: string) => Promise<void>;
  updateMemo: (id: number, title?: string, content?: string, mainCategory?: string, subCategory?: string) => Promise<void>;
  debouncedAutoSave: (id: number, data: { title?: string; content?: string; mainCategory?: string; subCategory?: string }) => void;
  isAutoSaving: boolean;
}

const MemoContext = createContext<MemoContextType | undefined>(undefined);

export const MemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMemo, setCurrentMemo] = useState<Memo | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const saveMemo = useCallback(async (
    title: string,
    content: string,
    mainCategory?: string,
    subCategory?: string
  ) => {
    try {
      const newMemo = await memoApi.createMemo({
        title,
        content,
        main_category: mainCategory,
        sub_category: subCategory
      });
      setCurrentMemo(newMemo);
    } catch (error) {
      console.error('メモの保存に失敗しました:', error);
      throw error;
    }
  }, []);

  const updateMemo = useCallback(async (
    id: number,
    title?: string,
    content?: string,
    mainCategory?: string,
    subCategory?: string
  ) => {
    try {
      setIsAutoSaving(true);
      const updatedMemo = await memoApi.updateMemo(id, {
        title,
        content,
        main_category: mainCategory,
        sub_category: subCategory
      });
      setCurrentMemo(updatedMemo);
    } catch (error) {
      console.error('メモの更新に失敗しました:', error);
      throw error;
    } finally {
      setIsAutoSaving(false);
    }
  }, []);

  // 自動保存のディバウンス処理
  const debouncedAutoSave = useCallback((
    id: number,
    data: { title?: string; content?: string; mainCategory?: string; subCategory?: string }
  ) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      updateMemo(
        id,
        data.title,
        data.content,
        data.mainCategory,
        data.subCategory
      ).catch(console.error);
    }, 2000); // 2秒後に保存

    setAutoSaveTimer(timer);
  }, [updateMemo, autoSaveTimer]);

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  return (
    <MemoContext.Provider value={{
      currentMemo,
      setCurrentMemo,
      saveMemo,
      updateMemo,
      debouncedAutoSave,
      isAutoSaving
    }}>
      {children}
    </MemoContext.Provider>
  );
};

export const useMemo = () => {
  const context = useContext(MemoContext);
  if (context === undefined) {
    throw new Error('useMemo must be used within a MemoProvider');
  }
  return context;
};
