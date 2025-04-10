import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Plus, Moon, Sun, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMemo } from "@/contexts/MemoContext";

const Index = () => {
  const [title, setTitle] = useState("無題");
  const [content, setContent] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentMemo, saveMemo, updateMemo, isAutoSaving } = useMemo();

  // メモが読み込まれたときの処理
  useEffect(() => {
    if (currentMemo) {
      setTitle(currentMemo.title);
      setContent(currentMemo.content);
    }
  }, [currentMemo]);

  // コンテンツの変更時の処理
  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    try {
      if (currentMemo) {
        await updateMemo(currentMemo.id, undefined, newContent);
      } else {
        const memo = await saveMemo(title, newContent);
      }
    } catch (error) {
      console.error('メモの保存に失敗しました:', error);
    }
  };

  // タイトルの変更時の処理
  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    try {
      if (currentMemo) {
        await updateMemo(currentMemo.id, newTitle, undefined);
      }
    } catch (error) {
      console.error('メモの保存に失敗しました:', error);
    }
  };

  // 新規メモの作成
  const handleNewNote = async () => {
    try {
      const newTitle = "無題";
      const newContent = "";
      await saveMemo(newTitle, newContent);
      setTitle(newTitle);
      setContent(newContent);
    } catch (error) {
      console.error('新規メモの作成に失敗しました:', error);
    }
  };

  const handleBack = () => {
    window.location.href = 'http://localhost:3000';
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleDone = () => {
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleTextToSpeech = async () => {
    if (!content.trim()) {
      return;
    }

    try {
      setIsConverting(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content,
          voice: {
            language_code: 'ja-JP',
            name: 'ja-JP-Neural2-B',
            ssml_gender: 'FEMALE'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('音声変換に失敗しました');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error('音声変換エラー:', error);
      // TODO: エラー表示の実装
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="note-container">
      <div className="note-header">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 gap-2 px-3"
          onClick={handleBack}
        >
          <ArrowLeft className="w-5 h-5" />
          戻る
        </Button>
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="note-title pl-0"
              placeholder="無題"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          {isMobile && (
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 px-3"
              onClick={handleDone}
            >
              完了
            </Button>
          )}
          <Button
            onClick={handleTextToSpeech}
            disabled={isConverting || !content.trim()}
            className={`px-4 py-2 text-sm font-medium ${
              isConverting ? 'bg-gray-300' : 'bg-[#232B3A]'
            } border border-white rounded-md hover:bg-[#232B3A]/90 transition-colors`}
          >
            {isConverting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '音声変換'
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="icon-button text-white hover:bg-white/10"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="icon-button text-white hover:bg-white/10"
            onClick={handleNewNote}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        className="note-content"
        placeholder="ここに入力"
        autocomplete="off"
        style={{ WebkitUserModify: 'read-write-plaintext-only' }}
      />
    </div>
  );
};

export default Index;
