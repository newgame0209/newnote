import React, { createContext, useContext, useState, useCallback } from 'react';
import memoApi from '@/api/memoApi';
import { Memo, MemoPage } from '@/types/memo';

interface MemoContextType {
  memos: Memo[];
  addMemo: (data: { 
    title: string; 
    content: string;
    mainCategory?: string; 
    subCategory?: string;
    pages?: MemoPage[]; // ページデータを违加
  }) => Promise<Memo>;
  updateMemo: (id: number, data: {
    title?: string;
    content?: string;
    mainCategory?: string;
    subCategory?: string;
    pages?: MemoPage[];
  }) => Promise<Memo>;
  getMemo: (id: number) => Promise<Memo>;
  deleteMemo: (id: number) => Promise<void>;
  fetchMemos: () => Promise<void>;
  // ページ操作用の新しいメソッド
  getMemoPages: (memoId: number) => Promise<MemoPage[]>; // メモの全ページを取得
  getMemoPage: (memoId: number, pageNumber: number) => Promise<MemoPage>;
  addMemoPage: (memoId: number, content?: string) => Promise<MemoPage>;
  updateMemoPage: (memoId: number, pageNumber: number, content: string) => Promise<MemoPage>;
  deleteMemoPage: (memoId: number, pageNumber: number) => Promise<void>;
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
    pages?: MemoPage[]; // ページデータを追加
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
    pages?: MemoPage[];
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

  // ページ操作のメソッドを追加
  const getMemoPages = useCallback(async (memoId: number) => {
    try {
      return await memoApi.getMemoPages(memoId);
    } catch (err) {
      throw err instanceof Error ? err : new Error('メモのページ一覧の取得に失敗しました');
    }
  }, []);

  const getMemoPage = useCallback(async (memoId: number, pageNumber: number) => {
    try {
      return await memoApi.getMemoPage(memoId, pageNumber);
    } catch (err) {
      throw err instanceof Error ? err : new Error('ページの取得に失敗しました');
    }
  }, []);

  const addMemoPage = useCallback(async (memoId: number, content: string = '') => {
    try {
      const newPage = await memoApi.addMemoPage(memoId, content);
      // メモの最新情報を取得して更新
      const updatedMemo = await memoApi.getMemo(memoId);
      setMemos(prev => prev.map(memo => 
        memo.id === memoId ? updatedMemo : memo
      ));
      return newPage;
    } catch (err) {
      throw err instanceof Error ? err : new Error('新規ページの作成に失敗しました');
    }
  }, []);

  const updateMemoPage = useCallback(async (memoId: number, pageNumber: number, content: string) => {
    try {
      const updatedPage = await memoApi.updateMemoPage(memoId, pageNumber, content);
      // メモの最新情報を取得して更新
      const updatedMemo = await memoApi.getMemo(memoId);
      setMemos(prev => prev.map(memo => 
        memo.id === memoId ? updatedMemo : memo
      ));
      return updatedPage;
    } catch (err) {
      throw err instanceof Error ? err : new Error('ページの更新に失敗しました');
    }
  }, []);

  const deleteMemoPage = useCallback(async (memoId: number, pageNumber: number) => {
    try {
      await memoApi.deleteMemoPage(memoId, pageNumber);
      // メモの最新情報を取得して更新
      const updatedMemo = await memoApi.getMemo(memoId);
      setMemos(prev => prev.map(memo => 
        memo.id === memoId ? updatedMemo : memo
      ));
    } catch (err) {
      throw err instanceof Error ? err : new Error('ページの削除に失敗しました');
    }
  }, []);

  return (
    <MemoContext.Provider value={{ 
      memos, 
      addMemo, 
      updateMemo, 
      getMemo, 
      deleteMemo, 
      fetchMemos, 
      loading, 
      error,
      // ページ操作用の新しいメソッドを追加
      getMemoPages,
      getMemoPage,
      addMemoPage,
      updateMemoPage,
      deleteMemoPage
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
