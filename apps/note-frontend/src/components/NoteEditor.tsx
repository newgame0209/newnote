import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/utils/utils';
import { Pen, Eraser, Highlighter, Eye, Bookmark, BookmarkPlus, X, RotateCcw } from 'lucide-react';
import { updatePage, getPage, executeOCR, synthesizeSpeech } from '@/api/notes';
import { fetchBookmarks, createBookmark, deleteBookmark } from '@/api/bookmarks';
import { useSettings } from '@/contexts/SettingsContext';
import { useNotes } from '@/contexts/NoteContext';
import { Bookmark as BookmarkType } from '@/types/note';

// グローバルなfabricの型定義
declare global {
  interface Window {
    fabric: any;
  }
}

/**
 * @docs
 * ノート編集画面のメインコンポーネント
 * Fabric.jsを使用して描画機能を提供し、ページ管理も行う
 */
export function NoteEditor() {
  const navigate = useNavigate();
  const { noteId } = useParams();
  const { voiceType, getSpeakingRateValue } = useSettings();
  const { notes, fetchNotes } = useNotes();
  const currentNote = notes.find(note => note.id === Number(noteId));
  const [noteTitle, setNoteTitle] = useState(currentNote?.title || '');  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(10); // 最大10ページ
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'marker' | 'view'>('pen');
  const [showPageIndicator, setShowPageIndicator] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrError, setOCRError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  
  // しおり機能関連の状態
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [bookmarkNotification, setBookmarkNotification] = useState<string | null>(null);

  // ページコンテンツを保存する配列
  const pagesRef = useRef<string[]>(Array(totalPages).fill(''));
  
  // キャンバスの操作履歴を管理（新方式）
  const [canUndoOperation, setCanUndoOperation] = useState<boolean>(false);
  const historyStackRef = useRef<Map<number, Array<string>>>(new Map());
  const currentPointerRef = useRef<Map<number, number>>(new Map());

  // キャンバスデータが空かどうかを判定する関数
  const isCanvasEmpty = (canvasData: any): boolean => {
    if (!canvasData) return true;
    
    // オブジェクトが存在しない、または空の配列の場合は空と判定
    if (!canvasData.objects || canvasData.objects.length === 0) return true;
    
    // 背景色以外のオブジェクトが存在するかチェック
    const hasDrawnObjects = canvasData.objects.some((obj: any) => {
      // パスオブジェクト（描画）、テキスト、画像などが存在するか
      return obj.type === 'path' || obj.type === 'text' || obj.type === 'image';
    });
    
    return !hasDrawnObjects;
  };

  // キャンバスの完全クリア関数
  const clearCanvas = () => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    
    // キャンバス上の全オブジェクトを削除
    canvas.clear();
    // 背景色を再設定
    canvas.backgroundColor = '#ffffff';
    // キャンバスを再描画
    canvas.renderAll();
    
    // 現在のページのデータもクリア
    pagesRef.current[currentPage - 1] = undefined;
  };

  // キャンバスの初期化
  useEffect(() => {
    const initCanvas = () => {
      if (!canvasRef.current) return;
      
      // キャンバスを破棄して再作成
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
      
      const canvas = new window.fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: window.innerWidth,
        height: window.innerHeight - 100,
        preserveObjectStacking: true,
        backgroundColor: '#ffffff',  // 白色の背景を設定
        selection: false,  // 選択機能を初期状態で無効化
        selectable: false, // オブジェクトの選択を初期状態で無効化
      });

      canvas.on('after:render', () => {
        console.log('キャンバス再描画完了');
      });
      
      // 操作履歴管理のためのイベントリスナーを追加（改善版）
      // 最後の描画操作からの経過時間を追跡
      let lastOperationTime = Date.now();
      // 保存操作がペンディング中かどうか
      let pendingSave = false;
      
      // キャンバスの状態を保存する関数（タイミング制御あり）
      const captureCanvasState = () => {
        if (!fabricRef.current || !currentPage) return;

        // 最後の操作からの経過時間をチェック
        const now = Date.now();
        const timeSinceLastOp = now - lastOperationTime;
        
        // 操作間の最小間隔（ミリ秒）
        const minInterval = 200;
        
        if (timeSinceLastOp < minInterval) {
          // 短時間内の連続呼び出しの場合は、最後の呼び出しのみを実行
          if (!pendingSave) {
            pendingSave = true;
            setTimeout(() => {
              if (fabricRef.current) {
                console.log('複数操作後の状態を保存します');
                addToHistory(currentPage);
                pendingSave = false;
              }
            }, minInterval);
          }
          return;
        }
        
        // 十分な時間が経過している場合は即座に保存
        console.log('操作完了、状態を保存します');
        addToHistory(currentPage);
        lastOperationTime = now;
      };
      
      // ペンを上げた時（描画完了時）に状態を保存
      canvas.on('mouse:up', captureCanvasState);
      
      // オブジェクト追加/変更/削除時にも状態を保存
      canvas.on('object:added', () => {
        console.log('オブジェクト追加を検知');
        lastOperationTime = Date.now();
      });
      
      canvas.on('object:modified', () => {
        console.log('オブジェクト変更を検知');
        captureCanvasState();
      });
      
      canvas.on('object:removed', () => {
        console.log('オブジェクト削除を検知');
        captureCanvasState();
      });

      fabricRef.current = canvas;
      setIsCanvasReady(true);

      if (noteId && currentPage) {
        setTimeout(() => {
          loadPageData(currentPage);
        }, 100);
      }
    };

    initCanvas();

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [noteId]);

  // 操作履歴に現在の状態を保存する関数（完全に刷新）
  const addToHistory = (pageNumber: number, isInitialState = false) => {
    if (!fabricRef.current) return;
    
    // JSON文字列として現在の状態を取得
    const jsonData = JSON.stringify(fabricRef.current.toJSON(['version']));
    
    // このページの履歴スタックを取得または初期化
    if (!historyStackRef.current.has(pageNumber)) {
      historyStackRef.current.set(pageNumber, []);
      currentPointerRef.current.set(pageNumber, -1);
    }
    
    const stack = historyStackRef.current.get(pageNumber)!;
    const currentPointer = currentPointerRef.current.get(pageNumber)!;
    
    // 初期状態か、同じ状態の連続追加を防止（最後の状態と比較）
    if (!isInitialState && currentPointer >= 0 && stack[currentPointer] === jsonData) {
      console.log('変更なし、履歴スキップ');
      return; // 変更なしの場合は追加しない
    }
    
    // ポインタ以降の履歴を削除（新しい操作分岐）
    if (currentPointer < stack.length - 1) {
      console.log(`ポインタ以降の履歴を削除: ${currentPointer + 1}～${stack.length - 1}`);
      stack.splice(currentPointer + 1);
    }
    
    // 新しい状態を追加
    stack.push(jsonData);
    currentPointerRef.current.set(pageNumber, stack.length - 1);
    
    // デバッグ情報
    console.log(`履歴追加: ページ${pageNumber}, ポインタ=${stack.length - 1}, 履歴数=${stack.length}`);
    
    // Undo可能状態を更新
    setCanUndoOperation(stack.length > 1);
    
    // データベースへの保存をスキップするフラグはリセット
    setSkipNextSave(false);
  };
  
  // undo操作後にデータベース保存をスキップするフラグ
  const [skipNextSave, setSkipNextSave] = useState(false);
  
  // 操作を元に戻す関数（完全に刷新）
  const undoOperation = () => {
    if (!fabricRef.current || !currentPage) return;
    
    const pageNumber = currentPage;
    
    // このページの履歴スタックを取得
    if (!historyStackRef.current.has(pageNumber)) {
      return; // 履歴が存在しない
    }
    
    const stack = historyStackRef.current.get(pageNumber)!;
    let currentPointer = currentPointerRef.current.get(pageNumber)!;
    
    // 最初の状態まで戻った場合はもう戻せない
    if (currentPointer <= 0) {
      setCanUndoOperation(false);
      return;
    }
    
    // ポインタを一つ前に移動
    currentPointer -= 1;
    currentPointerRef.current.set(pageNumber, currentPointer);
    
    console.log(`Undo実行: ページ${pageNumber}, 新ポインタ=${currentPointer}, 履歴数=${stack.length}`);
    
    // 状態復元を開始
    console.log(`状態復元開始: ページ${pageNumber}, ポインタ=${currentPointer}`);
    
    try {
      // キャンバスを一度クリアして状態を更新
      if (fabricRef.current) {
        // 現在のキャンバスをクリア - 全オブジェクトを削除して新しい状態にする
        fabricRef.current.clear();
        fabricRef.current.backgroundColor = '#ffffff';
        
        // データベース保存をスキップするフラグを設定
        setSkipNextSave(true);
        
        // 注意: 以前の状態を復元する前に、キャンバスの内部状態をリセット
        // これにより、以前の描画状態と現在の描画状態の競合を避ける
        fabricRef.current._objects = [];
        
        // 以前の状態を復元
        fabricRef.current.loadFromJSON(JSON.parse(stack[currentPointer]), () => {
          // 現在のツールに応じてブラシを設定
          if (fabricRef.current.isDrawingMode) {
            switch (currentTool) {
              case 'pen':
                configurePen(fabricRef.current);
                break;
              case 'eraser':
                configureEraser(fabricRef.current);
                break;
              case 'marker':
                configureMarker(fabricRef.current);
                break;
            }
          }
          
          // キャンバスを完全に更新して表示
          fabricRef.current.renderAll();
          fabricRef.current.requestRenderAll();
          console.log(`状態復元完了: ページ${pageNumber}, ポインタ=${currentPointer}`);
          
          // これ以上 Undo できるかどうかを設定
          setCanUndoOperation(currentPointer > 0);
        });
      }
    } catch (error) {
      console.error('キャンバス状態の復元に失敗しました:', error);
    }
  };
  
  // ページ変更時のみデータを読み込む
  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    
    setCurrentPage(newPage);
    loadPageData(newPage);
  };

  // ツール変更時の処理を更新
  useEffect(() => {
    if (!isCanvasReady || !fabricRef.current) return;
    const canvas = fabricRef.current;

    // 描画モードをリセット
    canvas.isDrawingMode = false;

    if (currentTool === 'view') {
      // 視覚モードの場合
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.skipTargetFind = true; // ターゲット検出を完全にスキップ
      canvas.hoverCursor = 'default';
      canvas.moveCursor = 'default';
      canvas.defaultCursor = 'default';
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
        obj.hasControls = false;
        obj.hasBorders = false;
        obj.lockMovementX = true;
        obj.lockMovementY = true;
        obj.hoverCursor = 'default';
      });
      document.body.style.overflow = 'auto';
    } else {
      // 描画モードの場合
      canvas.isDrawingMode = true;
      document.body.style.overflow = 'hidden';
      
      switch (currentTool) {
        case 'pen':
          configurePen(canvas);
          break;
        case 'eraser':
          configureEraser(canvas);
          break;
        case 'marker':
          configureMarker(canvas);
          break;
      }
    }

    canvas.renderAll();
  }, [currentTool, isCanvasReady]);

  // ペンの設定を管理する関数
  const configurePen = (canvas: any) => {
    if (!canvas) return;
    canvas.isDrawingMode = true;
    // 新しいブラシを明示的に作成
    canvas.freeDrawingBrush = new window.fabric.PencilBrush(canvas);
    const brush = canvas.freeDrawingBrush;
    brush.width = 2;
    brush.color = '#000000';
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
  };

  // 消しゴムの設定を管理する関数
  const configureEraser = (canvas: any) => {
    if (!canvas) return;
    canvas.isDrawingMode = true;
    // 消しゴム用の新しいブラシを作成
    canvas.freeDrawingBrush = new window.fabric.PencilBrush(canvas);
    const brush = canvas.freeDrawingBrush;
    brush.width = 20;
    brush.color = '#ffffff';
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
  };

  // マーカーの設定を管理する関数
  const configureMarker = (canvas: any) => {
    if (!canvas) return;
    canvas.isDrawingMode = true;
    // マーカー用の新しいブラシを作成
    canvas.freeDrawingBrush = new window.fabric.PencilBrush(canvas);
    const brush = canvas.freeDrawingBrush;
    brush.width = 10;
    brush.color = 'rgba(255, 255, 0, 0.4)';
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
  };

  // 保存ボタンのクリックハンドラ
  const handleSave = async () => {
    if (!fabricRef.current || !noteId) return;

    try {
      const canvasData = fabricRef.current.toJSON();
      console.log('保存するキャンバスデータ:', canvasData);

      const content = JSON.stringify(canvasData);
      const result = await updatePage(noteId, currentPage, content);
      console.log('保存結果:', result);
      
      alert('保存しました');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // 音声の一時停止/再開を制御する関数
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    } else {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  // 音声変換ボタンのクリックハンドラ
  const handleTextToSpeech = async () => {
    if (!fabricRef.current || !noteId) return;

    try {
      setIsOCRProcessing(true);
      setOCRError(null);
      setAudioError(null);
      setIsPaused(false);

      // 既存の音声を停止
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioRef.current = null;
        audioUrlRef.current = null;
      }

      // OCR処理を実行
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      const originalCanvas = fabricRef.current.getElement();
      
      tempCanvas.width = originalCanvas.width;
      tempCanvas.height = originalCanvas.height;
      
      tempContext.fillStyle = '#ffffff';
      tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempContext.drawImage(originalCanvas, 0, 0);
      
      const imageData = tempCanvas.toDataURL('image/jpeg', 1.0);
      
      console.log('OCR用の画像を生成しました');
      
      // OCR実行
      const text = await executeOCR(noteId, currentPage, imageData);
      console.log('OCR結果:', text);

      if (text.trim()) {
        // 音声生成と再生（話速設定を反映）
        const speakingRate = getSpeakingRateValue();
        const audioBlob = await synthesizeSpeech(text, voiceType, speakingRate);
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          audioRef.current = null;
        };

        audio.onerror = () => {
          setAudioError('音声の再生中にエラーが発生しました');
          setIsPlaying(false);
          setIsPaused(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          audioRef.current = null;
        };

        setIsPlaying(true);
        await audio.play();
      } else {
        setAudioError('テキストが見つかりませんでした');
      }

    } catch (error) {
      console.error('音声変換エラー:', error);
      setOCRError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
      setAudioError('音声の生成中にエラーが発生しました');
    } finally {
      setIsOCRProcessing(false);
    }
  };

  // ページデータの読み込み
  // しおり一覧を取得する関数
  const loadBookmarks = async () => {
    if (!noteId) return;
    
    try {
      const bookmarkList = await fetchBookmarks(noteId);
      setBookmarks(bookmarkList);
    } catch (error) {
      console.error('しおりの取得に失敗しました:', error);
    }
  };
  
  // 現在のページにしおりを追加する関数
  const addBookmark = async () => {
    if (!noteId) return;
    
    try {
      setIsAddingBookmark(true);
      await createBookmark(noteId, {
        page_number: currentPage,
        title: `ページ ${currentPage}`,
        is_favorite: false
      });
      
      // しおり一覧を再取得
      await loadBookmarks();
      
      // 成功通知を表示
      setBookmarkNotification(`ページ ${currentPage} にしおりを追加しました`);
      setTimeout(() => {
        setBookmarkNotification(null);
      }, 3000);
      
      setIsAddingBookmark(false);
    } catch (error) {
      console.error('しおりの追加に失敗しました:', error);
      setBookmarkNotification('しおりの追加に失敗しました');
      setTimeout(() => {
        setBookmarkNotification(null);
      }, 3000);
      setIsAddingBookmark(false);
    }
  };
  
  // しおりを削除する関数
  const removeBookmark = async (bookmarkId: number, e?: React.MouseEvent) => {
    if (!noteId) return;
    
    if (e) {
      e.stopPropagation(); // イベントの伝播を止める
    }
    
    try {
      await deleteBookmark(noteId, bookmarkId);
      // しおり一覧を再取得
      await loadBookmarks();
    } catch (error) {
      console.error('しおりの削除に失敗しました:', error);
    }
  };
  
  // しおりによるページ移動
  const navigateToBookmark = async (bookmark: BookmarkType) => {
    if (bookmark.page_number !== currentPage) {
      // 現在のページが変更されている場合は保存
      await saveCurrentPage();
      
      // しおり表示を閉じる（モバイル向け）
      setShowBookmarks(false);
      
      // ページを移動して即座にデータを読み込む
      setCurrentPage(bookmark.page_number);
      await loadPageData(bookmark.page_number);
    }
  };
  
  // 現在のページを保存する関数
  const saveCurrentPage = async () => {
    if (!fabricRef.current || !noteId) return;
    
    // undo操作直後の場合は、データベースへの保存をスキップ
    if (skipNextSave) {
      console.log('undo操作後のため、データベース保存をスキップします');
      return;
    }
    
    try {
      const canvasData = fabricRef.current.toJSON();
      const content = JSON.stringify(canvasData);
      await updatePage(noteId, currentPage, content);
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const loadPageData = async (pageNumber: number) => {
    if (!noteId || !fabricRef.current) return;

    try {
      const page = await getPage(noteId, pageNumber);
      console.log('取得したページデータ:', page);

      if (page?.content) {
        try {
          const canvasData = JSON.parse(page.content);
          console.log('パースしたキャンバスデータ:', canvasData);

          fabricRef.current.clear();
          fabricRef.current.loadFromJSON(canvasData, () => {
            fabricRef.current!.requestRenderAll();
            
            // 履歴を初期化し、現在のキャンバス状態を履歴の最初の状態として保存
            setTimeout(() => {
              addToHistory(pageNumber, true); // 初期状態として保存
            }, 100);
          });

          // ページ番号インジケータを表示
          setShowPageIndicator(true);
          setTimeout(() => {
            setShowPageIndicator(false);
          }, 2000);

        } catch (parseError) {
          console.error('キャンバスデータのパースエラー:', parseError);
          alert('データの読み込みに失敗しました');
        }
      } else {
        fabricRef.current.clear();
        // 空のキャンバス用の履歴初期化
        if (historyStackRef.current.has(pageNumber)) {
          historyStackRef.current.set(pageNumber, []);
          currentPointerRef.current.set(pageNumber, -1);
        }
        setCanUndoOperation(false);
        
        // ページ番号インジケータを表示
        setShowPageIndicator(true);
        setTimeout(() => {
          setShowPageIndicator(false);
        }, 2000);
      }
    } catch (error) {
      console.error('ページ読み込みエラー:', error);
      alert('ページの読み込みに失敗しました');
    }
  };

  // ページ番号クリックハンドラ
  const handlePageNumberClick = (pageNumber: number) => {
    if (pageNumber === currentPage) return;
    handlePageChange(pageNumber);
  };

  // タッチイベントハンドラー
  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentTool !== 'view') return;
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (currentTool !== 'view' || touchStart === null) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    handleSwipeNavigation(diff);
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // マウスイベントハンドラー
  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool !== 'view') return;
    setMouseStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (currentTool !== 'view' || mouseStart === null || !isDragging) return;

    const currentMouse = e.clientX;
    const diff = mouseStart - currentMouse;

    handleSwipeNavigation(diff);
  };

  const handleMouseUp = () => {
    setMouseStart(null);
    setIsDragging(false);
  };

  // ページナビゲーション共通ロジック
  const handleSwipeNavigation = (diff: number) => {
    // スワイプ/ドラッグの閾値（100pxの移動で次/前のページに遷移）
    if (Math.abs(diff) > 100) {
      if (diff > 0 && currentPage < totalPages) {
        // 左スワイプ/ドラッグ → 次のページ
        handlePageChange(currentPage + 1);
      } else if (diff < 0 && currentPage > 1) {
        // 右スワイプ/ドラッグ → 前のページ
        handlePageChange(currentPage - 1);
      }
      // 状態をリセット
      setTouchStart(null);
      setMouseStart(null);
      setIsDragging(false);
    }
  };

  useEffect(() => {
    // コンポーネントのマウント時にノート情報としおり情報を読み込む
    const fetchData = async () => {
      try {
        if (noteId) {
          await fetchNotes();
          await loadBookmarks();
        }
      } catch (error) {
        console.error('読み込みに失敗しました:', error);
      }
    };
    fetchData();
  }, [noteId, fetchNotes]);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#232B3A] text-white">
        <div className="mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="rounded-md hover:bg-white/10 p-1"
              >
                ← 戻る
              </button>
              <h1 className="text-lg font-semibold max-sm:max-w-[150px] max-sm:truncate">
                {currentNote?.title || ''}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="max-sm:px-3 px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium"
              >
                保存
              </button>
              <button
                onClick={isPlaying ? handlePlayPause : handleTextToSpeech}
                disabled={isOCRProcessing}
                className="max-sm:px-3 px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOCRProcessing ? (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <span>変換中...</span>
                  </div>
                ) : isPlaying ? (
                  isPaused ? '再開' : '一時停止'
                ) : (
                  '音声で読む'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ツールバー */}
      <div className="h-12 px-4 flex items-center justify-between bg-white border-b">
        <div className="flex items-center space-x-4">
          {(['pen', 'eraser', 'marker', 'view'] as const).map((tool) => (
            <button
              key={tool}
              onClick={() => setCurrentTool(tool)}
              className={cn(
                "p-2 rounded-md transition-colors",
                currentTool === tool
                  ? "bg-[#232B3A] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {tool === 'pen' && <Pen className="w-4 h-4" />}
              {tool === 'eraser' && <Eraser className="w-4 h-4" />}
              {tool === 'marker' && <Highlighter className="w-4 h-4" />}
              {tool === 'view' && <Eye className="w-4 h-4" />}
            </button>
          ))}
          <button
            onClick={undoOperation}
            disabled={!canUndoOperation}
            className={cn(
              "p-2 rounded-md transition-colors",
              !canUndoOperation
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            )}
            aria-label="操作を元に戻す"
            title="操作を元に戻す"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={cn(
              "p-2 rounded-md transition-colors flex items-center",
              showBookmarks ? "bg-[#232B3A] text-white" : "text-gray-700 hover:bg-gray-100"
            )}
            aria-label="しおり一覧"
            title="しおり一覧"
          >
            <Bookmark className="w-4 h-4 mr-1" />
            <span className="text-xs">しおり</span>
          </button>
          <button
            onClick={addBookmark}
            disabled={isAddingBookmark || bookmarks.some(b => b.page_number === currentPage)}
            className={cn(
              "p-2 rounded-md transition-colors flex items-center",
              bookmarks.some(b => b.page_number === currentPage) 
                ? "bg-blue-100 text-blue-600" 
                : isAddingBookmark 
                  ? "opacity-50 cursor-not-allowed text-gray-700" 
                  : "text-gray-700 hover:bg-gray-100"
            )}
            aria-label="現在のページをしおりに追加"
            title="現在のページをしおりに追加"
          >
            <BookmarkPlus className="w-4 h-4 mr-1" />
            <span className="text-xs">追加</span>
          </button>
        </div>
      </div>

      {/* キャンバス */}
      <div className="flex-1 relative bg-white">
        <div 
          className="w-full h-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}  // マウスがキャンバス外に出た場合もリセット
          style={{ cursor: currentTool === 'view' ? 'grab' : 'default' }}
        >
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: 'none' }}
          />
          
          {/* しおり一覧サイドパネル（スマホ・タブレット対応） */}
          {showBookmarks && (
            <div className="absolute top-0 right-0 h-full w-64 md:w-72 bg-white shadow-lg z-20 overflow-y-auto transition-transform duration-300">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-lg">しおり一覧</h3>
                <button 
                  onClick={() => setShowBookmarks(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label="閉じる"
                >
                  <X size={18} />
                </button>
              </div>
              
              {bookmarks.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  しおりはまだありません。<br />
                  <BookmarkPlus className="inline-block mx-1 mb-0.5" size={16} />ボタンをタップすると、<br />
                  現在のページをしおりに追加できます。
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {bookmarks
                    .sort((a, b) => a.page_number - b.page_number)
                    .map((bookmark) => (
                      <li key={bookmark.id} className="hover:bg-gray-50">
                        <button
                          onClick={() => navigateToBookmark(bookmark)}
                          className={cn(
                            "w-full text-left p-3 flex justify-between items-center",
                            bookmark.page_number === currentPage ? 'bg-blue-50' : ''
                          )}
                        >
                          <div className="flex items-center">
                            <Bookmark size={16} className="mr-2 text-blue-600" />
                            <span>
                              {bookmark.title || `ページ ${bookmark.page_number}`}
                            </span>
                          </div>
                          <button
                            onClick={(e) => removeBookmark(bookmark.id, e)}
                            className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                            aria-label="削除"
                          >
                            <X size={14} />
                          </button>
                        </button>
                      </li>
                    ))
                  }
                </ul>
              )}
            </div>
          )}
        </div>

        {/* OCRエラー表示 */}
        {ocrError && (
          <div className="fixed bottom-20 left-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <p>{ocrError}</p>
            <button
              onClick={() => setOCRError(null)}
              className="ml-2 underline hover:no-underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* 音声エラー表示 */}
        {audioError && (
          <div className="fixed bottom-20 left-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <p>{audioError}</p>
            <button
              onClick={() => setAudioError(null)}
              className="ml-2 underline hover:no-underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* しおり通知表示 */}
        {bookmarkNotification && (
          <div className="fixed top-20 right-6 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
            <p className="flex items-center">
              <Bookmark className="w-4 h-4 mr-2" />
              {bookmarkNotification}
            </p>
          </div>
        )}

        {/* ページ番号インジケータ */}
        {showPageIndicator && (
          <div className="fixed left-6 bottom-6 bg-gray-800/80 text-white px-4 py-2 rounded-lg font-medium text-sm transition-opacity duration-300">
            {currentPage} / 10
          </div>
        )}
      </div>
    </div>
  );
}
