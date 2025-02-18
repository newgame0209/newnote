import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Plus, Moon, Sun, Mic, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMemos } from "@/contexts/MemoContext";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const MemoEditor = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { addMemo, getMemo, updateMemo } = useMemos();
  const { memoId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setIsDark(false);
    document.documentElement.classList.remove('dark');
  }, []);

  // メモデータの読み込み
  useEffect(() => {
    const loadMemoData = async () => {
      if (memoId && memoId !== 'new') {
        try {
          const memo = await getMemo(Number(memoId));
          if (memo) {
            setTitle(memo.title);
            setContent(memo.content || '');
          }
        } catch (error) {
          console.error('メモの読み込みに失敗しました:', error);
        }
      }
    };
    loadMemoData();
  }, [memoId, getMemo]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
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
        await updateMemo(Number(memoId), {
          title,
          content,
          mainCategory: memo?.mainCategory || "",
          subCategory: memo?.subCategory || "",
        });
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

  const handleTextToSpeech = async () => {
    if (!content.trim()) {
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

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
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
                onClick={handleSave}
                className="max-sm:px-3 px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium"
              >
                保存
              </button>
              <button
                onClick={isPlaying ? handlePlayPause : handleTextToSpeech}
                disabled={!content.trim() || isConverting}
                className="max-sm:px-3 px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  '音声で読む'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className={`w-full min-h-[calc(100vh-200px)] bg-transparent resize-none focus:outline-none ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}
          placeholder="ここに内容を入力..."
        />
      </main>
    </div>
  );
};

export default MemoEditor;
