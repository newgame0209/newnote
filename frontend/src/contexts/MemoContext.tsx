import React, { createContext, useContext, useState, useCallback } from 'react';
import memoApi from '@/api/memoApi';
import { Memo } from '@/types/memo';

interface MemoContextType {
  memos: Memo[];
  addMemo: (data: { 
    title: string; 
    content: string;
    mainCategory?: string; 
    subCategory?: string; 
  }) => Promise<Memo>;
  updateMemo: (id: number, data: {
    title?: string;
    content?: string;
    mainCategory?: string;
    subCategory?: string;
  }) => Promise<Memo>;
  getMemo: (id: number) => Promise<Memo>;
  deleteMemo: (id: number) => Promise<void>;
  fetchMemos: () => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const MemoContext = createContext<MemoContextType | undefined>(undefined);

export function MemoProvider({ children }: { children: React.ReactNode }) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMemos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await memoApi.getMemos();
      setMemos(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('メモの取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  }, []);

  const addMemo = useCallback(async (data: { 
    title: string; 
    content: string;
    mainCategory?: string; 
    subCategory?: string; 
  }) => {
    try {
      const newMemo = await memoApi.createMemo(data);
      setMemos(prev => [...prev, newMemo]);
      return newMemo;
    } catch (err) {
      throw err instanceof Error ? err : new Error('メモの作成に失敗しました');
    }
  }, []);

  const updateMemo = useCallback(async (id: number, data: {
    title?: string;
    content?: string;
    mainCategory?: string;
    subCategory?: string;
  }) => {
    try {
      const updatedMemo = await memoApi.updateMemo(id, data);
      setMemos(prev => prev.map(memo => 
        memo.id === id ? updatedMemo : memo
      ));
      return updatedMemo;
    } catch (err) {
      throw err instanceof Error ? err : new Error('メモの更新に失敗しました');
    }
  }, []);

  const getMemo = useCallback(async (id: number) => {
    try {
      return await memoApi.getMemo(id);
    } catch (err) {
      throw err instanceof Error ? err : new Error('メモの取得に失敗しました');
    }
  }, []);

  const deleteMemo = useCallback(async (id: number) => {
    try {
      await memoApi.deleteMemo(id);
      setMemos(prev => prev.filter(memo => memo.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('メモの削除に失敗しました');
    }
  }, []);

  React.useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  return (
    <MemoContext.Provider value={{ 
      memos, 
      addMemo, 
      updateMemo, 
      getMemo, 
      deleteMemo, 
      fetchMemos, 
      loading, 
      error 
    }}>
      {children}
    </MemoContext.Provider>
  );
}

export function useMemos() {
  const context = useContext(MemoContext);
  if (context === undefined) {
    throw new Error('useMemos must be used within a MemoProvider');
  }
  return context;
}
