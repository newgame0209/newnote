import React, { useState, useRef, useEffect } from 'react';
import { Eye, Edit, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const NoteViewerTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isViewMode, setIsViewMode] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // 画面サイズの検出
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // キャンバスの初期化
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスの初期化
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // テスト用の描画内容
    ctx.fillStyle = 'red';
    ctx.fillRect(100, 100, 50, 50);
    ctx.fillStyle = 'blue';
    ctx.fillRect(400, 300, 50, 50);
    ctx.fillStyle = 'green';
    ctx.fillRect(700, 500, 50, 50);
    
    // テキスト追加
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('左上のコンテンツ', 100, 80);
    ctx.fillText('中央のコンテンツ', 380, 280);
    ctx.fillText('右下のコンテンツ', 680, 480);

    // モバイル表示の場合は自動的に全体表示
    if (isMobile) {
      setTimeout(fitToScreen, 300);
    }
  }, [isMobile]);

  // 表示を全体に合わせる
  const fitToScreen = () => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // 縦横比を維持しながら最適なスケールを計算
    const scaleX = containerWidth / canvasWidth;
    const scaleY = containerHeight / canvasHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // 最大1倍まで
    
    setScale(newScale);
    setPosition({ x: 0, y: 0 }); // 位置リセット
  };

  // ズームイン/アウト
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };
  
  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.1));
  };

  // マウス/タッチ操作のハンドラ
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isViewMode) return;
    
    setIsDragging(true);
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
      
    const clientY = 'touches' in e 
      ? e.touches[0].clientY 
      : (e as React.MouseEvent).clientY;
    
    setLastPosition({
      x: clientX,
      y: clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isViewMode) return;
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
      
    const clientY = 'touches' in e 
      ? e.touches[0].clientY 
      : (e as React.MouseEvent).clientY;
    
    setPosition(prev => ({
      x: prev.x + (clientX - lastPosition.x) / scale,
      y: prev.y + (clientY - lastPosition.y) / scale
    }));
    
    setLastPosition({
      x: clientX,
      y: clientY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ホイール操作によるズーム
  const handleWheel = (e: React.WheelEvent) => {
    if (!isViewMode) return;
    
    e.preventDefault();
    
    const delta = e.deltaY * -0.01;
    const newScale = Math.max(0.1, Math.min(scale + delta, 3)); // 0.1〜3倍の範囲
    
    setScale(newScale);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#232B3A] text-white">
        <div className="mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">ノート表示モードテスト</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsViewMode(false)} 
                className={`p-1 rounded-md ${!isViewMode ? 'bg-white/20' : 'hover:bg-white/10'}`}
                title="編集モード"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsViewMode(true)} 
                className={`p-1 rounded-md ${isViewMode ? 'bg-white/20' : 'hover:bg-white/10'}`}
                title="表示モード"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {isViewMode ? '表示モード' : '編集モード'}
            </h2>
            
            {isViewMode && (
              <div className="flex gap-2">
                <button 
                  onClick={zoomIn} 
                  className="p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  title="拡大"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button 
                  onClick={zoomOut} 
                  className="p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  title="縮小"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <button 
                  onClick={fitToScreen} 
                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  title="全体表示"
                >
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          
          <div 
            ref={containerRef}
            className="relative overflow-hidden border border-gray-300 bg-gray-50"
            style={{ 
              height: '70vh',
              cursor: isViewMode ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              style={{
                transform: isViewMode ? `scale(${scale}) translate(${position.x}px, ${position.y}px)` : 'none',
                transformOrigin: '0 0',
                touchAction: isViewMode ? 'none' : 'auto'
              }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="bg-white"
              />
            </div>
            
            {!isViewMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 text-white">
                <div className="p-4 bg-[#232B3A] rounded-md">
                  <p>編集モード - 実際のNoteEditorが表示される場所</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">使い方:</h3>
            <ul className="text-blue-700 space-y-1 pl-5 list-disc">
              <li>表示モードでは、ドラッグでパン、ホイールでズーム</li>
              <li>「全体表示」ボタンで画面に合わせる</li>
              <li>編集モードでは、従来の描画機能（このデモでは未実装）</li>
              <li>スマホでは自動的に全体表示にして見やすくしています</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoteViewerTest; 