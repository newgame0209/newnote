import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/utils/utils';
import { Pen, Eraser, Highlighter, Eye } from 'lucide-react';
import { updatePage, getPage, executeOCR, synthesizeSpeech } from '@/api/notes';
import { useSettings } from '@/contexts/SettingsContext';
import { useNotes } from '@/contexts/NoteContext';

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
  const { voiceType } = useSettings();
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
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ページコンテンツを保存する配列
  const pagesRef = useRef<string[]>(Array(totalPages).fill(''));

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

  // 音声変換ボタンのクリックハンドラ
  const handleTextToSpeech = async () => {
    if (!fabricRef.current || !noteId) return;

    try {
      setIsOCRProcessing(true);  // 既存のローディング状態を利用
      setOCRError(null);
      setAudioError(null);

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
        // 音声生成と再生
        const audioBlob = await synthesizeSpeech(text, voiceType);
        const audioUrl = URL.createObjectURL(audioBlob);

        // 既存の音声を停止
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        // 新しい音声を再生
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setAudioError('音声の再生中にエラーが発生しました');
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
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
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* ヘッダー */}
      <div className="h-16 px-4 flex items-center justify-between bg-[#232B3A] text-white">
        <button
          onClick={() => navigate('/')}
          className="hover:text-gray-300 transition-colors"
        >
          ← 戻る
        </button>
        {/* タイトルを中央に配置 */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-white font-medium">
            {currentNote?.title || ''}
          </h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-[#232B3A] border border-white rounded-md hover:bg-[#232B3A]/90 transition-colors"
          >
            保存
          </button>
          <button
            onClick={handleTextToSpeech}
            disabled={isOCRProcessing || isPlaying}
            className={`px-4 py-2 text-sm font-medium ${
              isOCRProcessing || isPlaying ? 'bg-gray-300' : 'bg-[#232B3A]'
            } border border-white rounded-md hover:bg-[#232B3A]/90 transition-colors`}
          >
            {isOCRProcessing ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '音声変換'
            )}
          </button>
        </div>
      </div>

      {/* ツールバー */}
      <div className="h-12 px-4 flex items-center space-x-4 bg-white border-b">
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
