import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Plus, Moon, Sun, Mic, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMemos } from "@/contexts/MemoContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { MemoPage } from "@/types/memo";

const MemoEditor = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTextExists, setSelectedTextExists] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  // ページ関連の状態追加
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<MemoPage[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { addMemo, getMemo, updateMemo, addMemoPage, updateMemoPage } = useMemos();
  const { memoId } = useParams();
  const navigate = useNavigate();
  // 設定情報の取得
  const { voiceType, getSpeakingRateValue } = useSettings();

  useEffect(() => {
    setIsDark(false);
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current;
        setSelectedTextExists(selectionStart !== selectionEnd);
      }
    };

    // テキストエリアにイベントリスナーを追加
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('mouseup', handleSelectionChange);
      textarea.addEventListener('keyup', handleSelectionChange);
      textarea.addEventListener('selectionchange', handleSelectionChange);
    }

    // クリーンアップ関数
    return () => {
      if (textarea) {
        textarea.removeEventListener('mouseup', handleSelectionChange);
        textarea.removeEventListener('keyup', handleSelectionChange);
        textarea.removeEventListener('selectionchange', handleSelectionChange);
      }
    };
  }, []);

  // メモデータの読み込み
  useEffect(() => {
    const loadMemoData = async () => {
      if (memoId && memoId !== 'new') {
        try {
          const memo = await getMemo(Number(memoId));
          if (memo) {
            setTitle(memo.title);
            
            // ページデータがある場合はページとして表示、ない場合は単一コンテンツとして表示
            if (memo.pages && memo.pages.length > 0) {
              setPages(memo.pages);
              setTotalPages(memo.pages.length);
              // 最初のページを表示
              setCurrentPageIndex(0);
              setContent(memo.pages[0].content || '');
            } else {
              // 互換性のため、contentだけある場合は最初のページとして扱う
              setPages([{ page_number: 0, content: memo.content || '' }]);
              setTotalPages(1);
              setCurrentPageIndex(0);
              setContent(memo.content || '');
            }
          }
        } catch (error) {
          console.error('メモの読み込みに失敗しました:', error);
        }
      } else if (memoId === 'new') {
        // 新規作成の場合は空のページを用意
        setPages([{ page_number: 0, content: '' }]);
        setTotalPages(1);
        setCurrentPageIndex(0);
        setContent('');
      }
    };
    loadMemoData();
  }, [memoId, getMemo]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // 現在のページの内容を更新
    const updatedPages = [...pages];
    if (updatedPages[currentPageIndex]) {
      updatedPages[currentPageIndex].content = newContent;
      setPages(updatedPages);
      
      // 既存のメモの場合は、APIを使ってページ内容を更新（デバウンス処理を追加するとよいでしょう）
      if (memoId && memoId !== 'new') {
        // 非同期処理のエラーハンドリングのため、即時実行関数を使用
        (async () => {
          try {
            await updateMemoPage(Number(memoId), currentPageIndex, newContent);
          } catch (error) {
            console.error('ページ内容の更新に失敗しました:', error);
            // UIには表示しないでログだけ出す（頻繁に呼ばれるため）
          }
        })();
      }
    }
  };

  const handleNewNote = () => {
    setTitle("無題");
    setContent("");
  };

  const handleBack = () => {
    navigate('/');
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDone = () => {
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (memoId && memoId !== 'new') {
        const memo = await getMemo(Number(memoId));
        
        // 現在のページの内容を最新に更新
        const updatedPages = [...pages];
        if (updatedPages[currentPageIndex]) {
          updatedPages[currentPageIndex].content = content;
        }
        
        // コンテンツの同期（1ページ目と同期して互換性を保持）
        const firstPageContent = updatedPages[0]?.content || '';
        
        await updateMemo(Number(memoId), {
          title,
          content: firstPageContent, // 1ページ目と同期
          pages: updatedPages,      // ページデータを保存
          mainCategory: memo?.mainCategory || "",
          subCategory: memo?.subCategory || "",
        });
        alert('保存しました');
      } else if (memoId === 'new') {
        // 新規メモの場合
        const updatedPages = [...pages];
        if (updatedPages[currentPageIndex]) {
          updatedPages[currentPageIndex].content = content;
        }
        
        const firstPageContent = updatedPages[0]?.content || '';
        
        const newMemo = await addMemo({
          title: title || '無題',
          content: firstPageContent,
          pages: updatedPages
        });
        
        // 新しく作成されたメモのページに遷移
        navigate(`/memo/${newMemo.id}`);
        alert('保存しました');
      }
    } catch (error) {
      console.error('メモの保存に失敗しました:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

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

  // 選択テキストの取得関数
  const getSelectedText = (): string => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      if (selectionStart !== selectionEnd) {
        return textareaRef.current.value.substring(selectionStart, selectionEnd);
      }
    }
    return content; // 選択がない場合は全文を返す
  };

  const handleTextToSpeech = async () => {
    // 選択されたテキストまたは全テキストを取得
    const textToSpeak = getSelectedText().trim();
    
    if (!textToSpeak) {
      return;
    }

    try {
      setIsConverting(true);

      // 既存の音声を停止
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioRef.current = null;
        audioUrlRef.current = null;
      }

      // 音声タイプとスピード設定を取得
      const speakingRate = getSpeakingRateValue();
      
      const response = await fetch(`${import.meta.env.VITE_NOTE_API_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: textToSpeak,
          voice: {
            language_code: 'ja-JP',
            ssml_gender: voiceType === 'male' ? 'MALE' : 'FEMALE',
            name: voiceType === 'male' ? 'ja-JP-Neural2-C' : 'ja-JP-Neural2-B'
          },
          audio_config: {
            speaking_rate: speakingRate
          }
        }),
      });

      if (!response.ok) {
        throw new Error('音声変換に失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
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
        setIsPlaying(false);
        setIsPaused(false);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
        alert('音声の再生中にエラーが発生しました');
      };

      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('音声変換エラー:', error);
      alert('音声変換に失敗しました');
    } finally {
      setIsConverting(false);
    }
  };

  // ページの追加処理
  const handleAddPage = async () => {
    // 最大10ページまで
    if (totalPages >= 10) {
      alert('メモは最大10ページまで作成できます');
      return;
    }
    
    try {
      // 現在の編集内容をページに保存
      const updatedPages = [...pages];
      if (updatedPages[currentPageIndex]) {
        updatedPages[currentPageIndex].content = content;
      }
      
      // 新しいページを追加
      const newPageNumber = totalPages;
      const newPage = { page_number: newPageNumber, content: '' };
      
      if (memoId && memoId !== 'new') {
        // 既存メモの場合はAPIを呼び出してページを追加
        await addMemoPage(Number(memoId));
      }
      
      // ローカルステートの更新
      updatedPages.push(newPage);
      setPages(updatedPages);
      setTotalPages(prev => prev + 1);
      
      // 新しいページに切り替え
      setCurrentPageIndex(newPageNumber);
      setContent('');
      
    } catch (error) {
      console.error('ページの追加に失敗しました:', error);
      alert('ページの追加に失敗しました');
    }
  };

  // ページの切り替え
  const handlePageChange = (index: number) => {
    if (index < 0 || index >= totalPages) return;
    
    // 現在のページの内容を保存
    const updatedPages = [...pages];
    if (updatedPages[currentPageIndex]) {
      updatedPages[currentPageIndex].content = content;
      
      // 既存のメモの場合は、APIを使って現在のページ内容を更新してから切り替え
      if (memoId && memoId !== 'new') {
        // 非同期処理だが、ページ切り替えを遅延させないためにawaitしない
        (async () => {
          try {
            await updateMemoPage(Number(memoId), currentPageIndex, content);
            console.log(`ページ ${currentPageIndex} の内容を保存しました`);
          } catch (error) {
            console.error('ページ内容の更新に失敗しました:', error);
          }
        })();
      }
    }
    setPages(updatedPages);
    
    // 新しいページに切り替え
    setCurrentPageIndex(index);
    setContent(updatedPages[index]?.content || '');
  };

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
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold max-sm:max-w-[150px] max-sm:truncate">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddPage}
                title="新規ページを追加"
                className="max-sm:px-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                <span className="max-sm:hidden">ページ追加</span>
              </button>
              <button
                onClick={handleSave}
                className="max-sm:px-3 px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium"
              >
                保存
              </button>
              <button
                onClick={isPlaying ? handlePlayPause : handleTextToSpeech}
                disabled={!content.trim() || isConverting}
                className="max-sm:px-3 px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed relative"
                onMouseEnter={() => setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
              >
                {isConverting ? (
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
                  <div className="flex items-center gap-1">
                    <Mic className="w-4 h-4" />
                    <span>{selectedTextExists ? '選択部分を読む' : '音声で読む'}</span>
                  </div>
                )}
                {/* ツールチップ */}
                {tooltipVisible && !isPlaying && !isConverting && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
                    {selectedTextExists ? 'テキストの選択部分を音声に変換します' : '全てのテキストを音声に変換します'}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-2 flex justify-center">
        {/* ページ切り替えナビゲーション */}
        <div className="flex items-center space-x-2 mt-2">
          <button 
            onClick={() => handlePageChange(currentPageIndex - 1)}
            disabled={currentPageIndex === 0}
            className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <span className="text-sm text-gray-600">
            {currentPageIndex + 1} / {totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(currentPageIndex + 1)}
            disabled={currentPageIndex === totalPages - 1}
            className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      <main className="container mx-auto px-4 pb-6">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className={`w-full min-h-[calc(100vh-230px)] bg-transparent resize-none focus:outline-none ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}
          placeholder="ここに内容を入力..."
        />
      </main>
    </div>
  );
};

export default MemoEditor;
