import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import memoApi from '@/api/memoApi';
import { Memo, MemoPage, CreateMemoData, UpdateMemoData } from '@/types/memo';

// デバッグ用のログ関数
const logDebug = (message: string, data?: any) => {
  console.log(`[Memo Context Debug] ${message}`, data || '');
};

interface MemoContextType {
  memos: Memo[];
  addMemo: (data: CreateMemoData) => Promise<Memo>;
  updateMemo: (id: number, data: UpdateMemoData) => Promise<Memo>;
  getMemo: (id: number) => Promise<Memo>;
  deleteMemo: (id: number) => Promise<void>;
  fetchMemos: () => Promise<void>;
  // ページ操作用のメソッド
  getMemoPages: (memoId: number) => Promise<MemoPage[]>; // メモの全ページを取得
  getMemoPage: (memoId: number, pageNumber: number) => Promise<MemoPage>;
  addMemoPage: (memoId: number, content?: string) => Promise<MemoPage>;
  updateMemoPage: (memoId: number, pageNumber: number, content: string) => Promise<MemoPage>;
  deleteMemoPage: (memoId: number, pageNumber: number) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const MemoContext = createContext<MemoContextType | null>(null);

export function MemoProvider({ children }: { children: ReactNode }) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMemos = useCallback(async () => {
    // トークンがない場合は処理をスキップ
    const token = localStorage.getItem('token');
    if (!token) {
      logDebug('トークンがないため、メモ一覧取得をスキップ');
      return;
    }

    try {
      logDebug('メモ一覧取得開始');
      setLoading(true);
      setError(null);
      const data = await memoApi.getMemos();
      logDebug('メモ一覧取得成功', { count: data.length });
      setMemos(data);
    } catch (err) {
      logDebug('メモ一覧取得エラー', err);
      setError(err instanceof Error ? err : new Error('メモの取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  }, []);

  const addMemo = useCallback(async (data: CreateMemoData) => {
    try {
      logDebug('メモ作成開始', data);
      setLoading(true);
      setError(null);
      const newMemo = await memoApi.createMemo(data);
      logDebug('メモ作成成功', newMemo);
      setMemos(prev => [...prev, newMemo]);
      return newMemo;
    } catch (err) {
      logDebug('メモ作成エラー', err);
      setError(err instanceof Error ? err : new Error('メモの作成に失敗しました'));
      throw err instanceof Error ? err : new Error('メモの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMemo = useCallback(async (id: number, data: UpdateMemoData) => {
    try {
      logDebug('メモ更新開始', { id, ...data });
      setLoading(true);
      setError(null);
      const updatedMemo = await memoApi.updateMemo(id, data);
      logDebug('メモ更新成功', updatedMemo);
      setMemos(prev => prev.map(memo => 
        memo.id === id ? updatedMemo : memo
      ));
      return updatedMemo;
    } catch (err) {
      logDebug('メモ更新エラー', err);
      setError(err instanceof Error ? err : new Error('メモの更新に失敗しました'));
      throw err instanceof Error ? err : new Error('メモの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMemo = useCallback(async (id: number) => {
    try {
      logDebug('メモ取得開始', { id });
      setLoading(true);
      setError(null);
      const memo = await memoApi.getMemo(id);
      logDebug('メモ取得成功', memo);
      return memo;
    } catch (err) {
      logDebug('メモ取得エラー', err);
      setError(err instanceof Error ? err : new Error('メモの取得に失敗しました'));
      throw err instanceof Error ? err : new Error('メモの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMemo = useCallback(async (id: number) => {
    try {
      logDebug('メモ削除開始', { id });
      setLoading(true);
      setError(null);
      await memoApi.deleteMemo(id);
      logDebug('メモ削除成功', { id });
      setMemos(prev => prev.filter(memo => memo.id !== id));
    } catch (err) {
      logDebug('メモ削除エラー', err);
      setError(err instanceof Error ? err : new Error('メモの削除に失敗しました'));
      throw err instanceof Error ? err : new Error('メモの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  // ページ操作のメソッドを追加
  const getMemoPages = useCallback(async (memoId: number) => {
    try {
      logDebug('メモページ一覧取得開始', { memoId });
      setLoading(true);
      setError(null);
      const pages = await memoApi.getMemoPages(memoId);
      logDebug('メモページ一覧取得成功', { memoId, pageCount: pages.length });
      return pages;
    } catch (err) {
      logDebug('メモページ一覧取得エラー', err);
      setError(err instanceof Error ? err : new Error('メモのページ一覧の取得に失敗しました'));
      throw err instanceof Error ? err : new Error('メモのページ一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMemoPage = useCallback(async (memoId: number, pageNumber: number) => {
    try {
      logDebug('メモページ取得開始', { memoId, pageNumber });
      setLoading(true);
      setError(null);
      const page = await memoApi.getMemoPage(memoId, pageNumber);
      logDebug('メモページ取得成功', { memoId, pageNumber, page });
      return page;
    } catch (err) {
      logDebug('メモページ取得エラー', err);
      setError(err instanceof Error ? err : new Error('ページの取得に失敗しました'));
      throw err instanceof Error ? err : new Error('ページの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMemoPage = useCallback(async (memoId: number, content: string = '') => {
    try {
      logDebug('メモページ追加開始', { memoId, contentLength: content.length });
      setLoading(true);
      setError(null);
      const newPage = await memoApi.addMemoPage(memoId, content);
      logDebug('メモページ追加成功', { memoId, newPage });
      
      // メモの最新情報を取得して更新
      const updatedMemo = await memoApi.getMemo(memoId);
      setMemos(prev => prev.map(memo => 
        memo.id === memoId ? updatedMemo : memo
      ));
      
      return newPage;
    } catch (err) {
      logDebug('メモページ追加エラー', err);
      setError(err instanceof Error ? err : new Error('ページの追加に失敗しました'));
      throw err instanceof Error ? err : new Error('ページの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMemoPage = useCallback(async (memoId: number, pageNumber: number, content: string) => {
    try {
      logDebug('メモページ更新開始', { memoId, pageNumber, contentLength: content.length });
      setLoading(true);
      setError(null);
      const updatedPage = await memoApi.updateMemoPage(memoId, pageNumber, content);
      logDebug('メモページ更新成功', { memoId, pageNumber, updatedPage });
      
      // メモの最新情報を取得して更新
      const updatedMemo = await memoApi.getMemo(memoId);
      setMemos(prev => prev.map(memo => 
        memo.id === memoId ? updatedMemo : memo
      ));
      
      return updatedPage;
    } catch (err) {
      logDebug('メモページ更新エラー', err);
      setError(err instanceof Error ? err : new Error('ページの更新に失敗しました'));
      throw err instanceof Error ? err : new Error('ページの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMemoPage = useCallback(async (memoId: number, pageNumber: number) => {
    try {
      logDebug('メモページ削除開始', { memoId, pageNumber });
      setLoading(true);
      setError(null);
      await memoApi.deleteMemoPage(memoId, pageNumber);
      logDebug('メモページ削除成功', { memoId, pageNumber });
      
      // メモの最新情報を取得して更新
      const updatedMemo = await memoApi.getMemo(memoId);
      setMemos(prev => prev.map(memo => 
        memo.id === memoId ? updatedMemo : memo
      ));
    } catch (err) {
      logDebug('メモページ削除エラー', err);
      setError(err instanceof Error ? err : new Error('ページの削除に失敗しました'));
      throw err instanceof Error ? err : new Error('ページの削除に失敗しました');
    } finally {
      setLoading(false);
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
      getMemoPages,
      getMemoPage,
      addMemoPage,
      updateMemoPage,
      deleteMemoPage,
      loading,
      error
    }}>
      {children}
    </MemoContext.Provider>
  );
}

export function useMemos() {
  const context = useContext(MemoContext);
  if (context === null) {
    throw new Error('useMemos must be used within a MemoProvider');
  }
  return context;
}
