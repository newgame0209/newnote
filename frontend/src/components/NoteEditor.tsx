import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/utils/utils';
import { Pen, Eraser, Highlighter, Type, Image, Eye } from 'lucide-react';

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
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'marker' | 'text' | 'image' | 'view'>('pen');
  const [showPageIndicator, setShowPageIndicator] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  // ページコンテンツを保存する配列
  const pagesRef = useRef<string[]>(Array(totalPages).fill(''));

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

  // ツール変更時の処理
  useEffect(() => {
    if (!fabricRef.current || !isCanvasReady) return;

    const canvas = fabricRef.current;
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
      case 'view':
        canvas.isDrawingMode = false;
        break;
      default:
        canvas.isDrawingMode = true;
        configurePen(canvas);
    }
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
        case 'text':
          canvas.isDrawingMode = false;
          break;
        case 'image':
          canvas.isDrawingMode = false;
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

  // ページ切り替え時の処理
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    saveCurrentPage();
    setCurrentPage(newPage);
    loadPage(newPage);
    
    // ページインジケータを表示
    setShowPageIndicator(true);
    setTimeout(() => setShowPageIndicator(false), 2000);
  };

  // スワイプ検出の処理
  useEffect(() => {
    if (currentTool === 'view') return; // 視覚モードの場合はスワイプを無効化

    let touchStartX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) { // スワイプの閾値
        if (diff > 0 && currentPage < totalPages) {
          handlePageChange(currentPage + 1);
        } else if (diff < 0 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPage, currentTool]);

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
        {(['pen', 'eraser', 'marker', 'text', 'image', 'view'] as const).map((tool) => (
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
            {tool === 'text' && <Type className="w-4 h-4" />}
            {tool === 'image' && <Image className="w-4 h-4" />}
            {tool === 'view' && <Eye className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {/* キャンバス */}
      <div className="flex-1 relative bg-white">
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* ページインジケータ */}
      {showPageIndicator && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
          {currentPage} / {totalPages}
        </div>
      )}
    </div>
  );
}
