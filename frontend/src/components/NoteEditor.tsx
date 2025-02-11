import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/utils/utils';
import { Pen, Eraser, Highlighter, Eye } from 'lucide-react';

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
      if (!canvasRef.current || fabricRef.current) return;

      // window.fabric から取得（CDN 経由で読み込んでいることが前提）
      const fabric = window.fabric;
      if (!fabric) {
        console.error('Fabric.js が読み込まれていません。public/index.html に CDN スクリプトを追加してください。');
        return;
      }

      try {
        const container = canvasRef.current.parentElement;
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        const canvas = new fabric.Canvas(canvasRef.current, {
          width,
          height,
          backgroundColor: '#ffffff',
          isDrawingMode: true,
          selection: false,
        });

        console.log('Canvas initialized:', canvas);
        fabricRef.current = canvas;
        setIsCanvasReady(true);

        // 初期化時にキャンバスをクリア
        clearCanvas();

        canvas.on('touch:gesture', (opt: any) => {
          if (opt.e.touches && opt.e.touches.length === 2) {
            opt.e.preventDefault();
          }
        });

        configurePen(canvas);

        const handleResize = () => {
          if (!container) return;
          const newWidth = container.clientWidth;
          const newHeight = container.clientHeight;
          canvas.setWidth(newWidth);
          canvas.setHeight(newHeight);
          canvas.renderAll();
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          document.body.style.overflow = 'auto';
          canvas.dispose();
          fabricRef.current = null;
          setIsCanvasReady(false);
        };
      } catch (error) {
        console.error('Canvas initialization error:', error);
        setIsCanvasReady(false);
      }
    };

    // DOMの読み込み完了後にキャンバスを初期化
    if (document.readyState === 'complete') {
      initCanvas();
    } else {
      window.addEventListener('load', initCanvas);
      return () => window.removeEventListener('load', initCanvas);
    }
  }, []);

  // ツール変更時の処理を更新
  useEffect(() => {
    if (!isCanvasReady || !fabricRef.current) return;
    const canvas = fabricRef.current;

    // 前回のツールの状態をリセット
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.forEachObject((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    switch (currentTool) {
      case 'pen':
        canvas.isDrawingMode = true;
        configurePen(canvas);
        break;
      case 'eraser':
        canvas.isDrawingMode = true;
        configureEraser(canvas);
        break;
      case 'marker':
        canvas.isDrawingMode = true;
        configureMarker(canvas);
        break;
      case 'view':
        // 視覚モードの場合のみ、オブジェクトの選択と操作を無効化
        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        break;
    }
  }, [currentTool, isCanvasReady]);

  // ページ変更時の処理を更新
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;

    // 現在のページの状態を保存
    if (fabricRef.current) {
      const canvas = fabricRef.current;
      const currentData = canvas.toJSON();
      
      // 空のキャンバスは保存しない（undefinedのまま）
      if (!isCanvasEmpty(currentData)) {
        pagesRef.current[currentPage - 1] = currentData;
      }
    }

    // 新しいページに切り替える時はキャンバスをクリア
    clearCanvas();

    // 新しいページの状態を読み込む（保存データが存在し、空でない場合のみ）
    const newPageData = pagesRef.current[newPage - 1];
    if (newPageData && !isCanvasEmpty(newPageData)) {
      fabricRef.current?.loadFromJSON(
        newPageData,
        fabricRef.current.renderAll.bind(fabricRef.current)
      );
    }

    setCurrentPage(newPage);
    setShowPageIndicator(true);
    setTimeout(() => setShowPageIndicator(false), 2000);
  };

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

  // 視覚モードの状態管理
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    if (currentTool === 'view') {
      // 視覚モードの場合
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.forEachObject((obj: any) => {
        obj.selectable = false;
        obj.evented = false;
      });
      document.body.style.overflow = 'auto';
    } else {
      // その他のモードの場合
      canvas.selection = true;
      canvas.forEachObject((obj: any) => {
        obj.selectable = true;
        obj.evented = true;
      });
      document.body.style.overflow = 'hidden';

      // ツール別の設定
      switch (currentTool) {
        case 'pen':
          canvas.isDrawingMode = true;
          configurePen(canvas);
          break;
        case 'eraser':
          canvas.isDrawingMode = true;
          configureEraser(canvas);
          break;
        case 'marker':
          canvas.isDrawingMode = true;
          configureMarker(canvas);
          break;
      }
    }
  }, [currentTool]);

  // 現在のページを保存
  const saveCurrentPage = () => {
    if (!fabricRef.current) return;
    pagesRef.current[currentPage - 1] = JSON.stringify(fabricRef.current.toJSON());
  };

  // 指定したページを読み込む
  const loadPage = (pageNumber: number) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const pageContent = pagesRef.current[pageNumber - 1];
    
    if (pageContent) {
      canvas.loadFromJSON(pageContent, canvas.renderAll.bind(canvas));
    } else {
      canvas.clear();
    }
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
        <div className="flex space-x-4">
          <button className="px-4 py-2 text-sm font-medium bg-[#232B3A] border border-white rounded-md hover:bg-[#232B3A]/90 transition-colors">
            保存
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-[#232B3A] border border-white rounded-md hover:bg-[#232B3A]/90 transition-colors">
            音声変換
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

        {/* ページインジケータ */}
        {showPageIndicator && (
          <div className="fixed bottom-8 left-8 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-lg">
            {currentPage} / {totalPages}
          </div>
        )}
      </div>
    </div>
  );
}
