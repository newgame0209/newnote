import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Plus, Mic, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false); // 保存中の状態管理で使用
  const [selectedTextExists, setSelectedTextExists] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  // ページ関連の状態追加（1ベース）
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pages, setPages] = useState<MemoPage[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { addMemo, getMemo, updateMemo, addMemoPage, updateMemoPage, getMemoPages, getMemoPage } = useMemos();
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
          console.log(`メモ ${memoId} を読み込み中...`);
          const memo = await getMemo(Number(memoId));
          console.log('取得したメモデータ:', memo);
          
          if (memo) {
            setTitle(memo.title);
            
            // ページデータを取得
            try {
              // メモの全ページを取得
              const memoPages = await getMemoPages(Number(memoId));
              console.log(`メモ ${memoId} のページデータを取得:`, memoPages);
              
              if (memoPages && memoPages.length > 0) {
                setPages(memoPages);
                setTotalPages(memoPages.length);
                // 最初のページを表示 (1ベースでページを管理)
                setCurrentPageIndex(1);
                setContent(memoPages[0].content || '');
              } else {
                // ページがない場合は互換性のためcontentを使用
                console.log('ページデータがないため、メモのcontentを使用');
                const firstPage = {
                  memo_id: Number(memoId),
                  page_number: 1,
                  content: memo.content || ''
                };
                setPages([firstPage]);
                setTotalPages(1);
                setCurrentPageIndex(1);
                setContent(memo.content || '');
              }
            } catch (pageError) {
              console.error('ページデータの取得に失敗:', pageError);
              // ページ取得に失敗した場合はcontentを使用
              const firstPage = {
                memo_id: Number(memoId),
                page_number: 1,
                content: memo.content || ''
              };
              setPages([firstPage]);
              setTotalPages(1);
              setCurrentPageIndex(1);
              setContent(memo.content || '');
            }
          }
        } catch (error) {
          console.error('メモの読み込みに失敗しました:', error);
        }
      } else if (memoId === 'new') {
        // 新規作成の場合は空のページを用意 (1ベースでページを管理)
        setPages([{ page_number: 1, content: '' }]);
        setTotalPages(1);
        setCurrentPageIndex(1);
        setContent('');
      }
    };
    loadMemoData();
  }, [memoId, getMemo, getMemoPages]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // 現在のページの内容を更新（1ベース配列のため、インデックスは-1する）
    const updatedPages = [...pages];
    const currentPageArrayIndex = currentPageIndex - 1; // 1ベースから0ベースのインデックスに変換
    if (updatedPages[currentPageArrayIndex]) {
      updatedPages[currentPageArrayIndex].content = newContent;
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

  // 不要な関数を削除

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
      
      // 認証トークンを取得（Firebase Auth）
      const auth = (await import('firebase/auth')).getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      
      if (!token) {
        throw new Error('認証情報が取得できません。再ログインしてください。');
      }
      
      const response = await fetch(`${import.meta.env.VITE_NOTE_API_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`音声変換エラー: ステータス ${response.status}, レスポンス:`, errorText);
        throw new Error(`音声変換に失敗しました (${response.status})`);
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
      alert(error instanceof Error ? error.message : '音声変換に失敗しました');
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
      const currentPageArrayIndex = currentPageIndex - 1; // 1ベースから0ベースのインデックスに変換
      
      // 現在のページ内容を更新（エラー回避のためのチェック追加）
      if (currentPageArrayIndex >= 0 && currentPageArrayIndex < updatedPages.length) {
        updatedPages[currentPageArrayIndex].content = content;
        
        // 既存のメモの場合は現在のページ内容を保存
        if (memoId && memoId !== 'new') {
          try {
            await updateMemoPage(Number(memoId), currentPageIndex, content);
            console.log(`ページ ${currentPageIndex} の内容を保存しました`);
          } catch (error) {
            console.error('ページ内容の更新に失敗しました:', error);
          }
        }
      }
      
      if (memoId && memoId !== 'new') {
        // 既存メモの場合はAPIを呼び出してページを追加
        console.log(`Adding new page to memo ${memoId}`);
        const newPageResponse = await addMemoPage(Number(memoId));
        console.log('API response for new page:', newPageResponse);
        
        // API レスポンスから新しいページの情報を取得
        if (newPageResponse) {
          // レスポンスのプロパティ名を確認
          console.log('レスポンスのプロパティ名確認:', 
            Object.keys(newPageResponse).join(', '));
          
          // キャメルケースかスネークケースか判断
          const hasSnakeCase = 'page_number' in newPageResponse;
          const hasCamelCase = 'pageNumber' in newPageResponse;
          
          console.log(`プロパティ名形式: スネークケース=${hasSnakeCase}, キャメルケース=${hasCamelCase}`);
          
          // ページ番号をプロパティ名形式に応じて取得
          let newPageNumber: number | undefined;
          
          if (hasSnakeCase) {
            newPageNumber = (newPageResponse as any).page_number;
          } else if (hasCamelCase) {
            newPageNumber = (newPageResponse as any).pageNumber;
          }
          
          if (!newPageNumber) {
            console.error('ページ番号が見つかりません:', newPageResponse);
            throw new Error('新規ページの作成に失敗しました');
          }
          
          console.log(`新規ページ情報: ページ番号=${newPageNumber}`);
          
          // レスポンスの形式に応じてデータを抽出
          let content = '';
          let created_at: string | undefined;
          let updated_at: string | undefined;
          
          if (hasSnakeCase) {
            content = (newPageResponse as any).content || '';
            created_at = (newPageResponse as any).created_at;
            updated_at = (newPageResponse as any).updated_at;
          } else if (hasCamelCase) {
            content = (newPageResponse as any).content || '';
            created_at = (newPageResponse as any).createdAt;
            updated_at = (newPageResponse as any).updatedAt;
          }
          
          console.log(`抽出したページデータ: content=${content}, created_at=${created_at}, updated_at=${updated_at}`);
          
          // MemoPage型に合わせてデータを組み立て
          const newPage: MemoPage = {
            memo_id: Number(memoId),
            page_number: newPageNumber,
            content: content,
            created_at: created_at,
            updated_at: updated_at
          };
          
          // 新しいページを追加
          const newPages = [...updatedPages, newPage];
          
          // ページ番号でソート
          const sortedPages = newPages.sort((a, b) => a.page_number - b.page_number);
          
          // ページデータを更新
          setPages(sortedPages);
          setTotalPages(sortedPages.length);
          
          // 新しいページに切り替え
          setCurrentPageIndex(newPageNumber);
          setContent(newPage.content);
          
          console.log('新しいページを追加しました:', { newPage, totalPages: sortedPages.length });
        } else {
          console.error('新規ページのレスポンスが無効です:', newPageResponse);
          throw new Error('新規ページの作成に失敗しました');
        }
      } else {
        // 新規メモの場合（まだサーバーに保存されていない）
        const newPageNumber = totalPages + 1; // 1ベースのページ番号
        const newPage = {
          page_number: newPageNumber,
          content: ''
        };
        
        // ページデータを更新
        const newPages = [...updatedPages, newPage];
        setPages(newPages);
        setTotalPages(newPages.length);
        
        // 新しいページに切り替え
        setCurrentPageIndex(newPageNumber);
        setContent('');
      }
    } catch (error) {
      console.error('ページの追加に失敗しました:', error);
      alert('ページの追加に失敗しました');
    }
  };

  // ページの切り替え
  const handlePageChange = (index: number) => {
    if (index < 1 || index > totalPages) {
      console.log(`無効なページインデックス: ${index}, 有効範囲: 1 ~ ${totalPages}`);
      return;
    }
    
    try {
      // 現在のページの内容を保存
      const updatedPages = [...pages];
      const currentPageArrayIndex = currentPageIndex - 1; // 1ベースから0ベースのインデックスに変換
      
      console.log(`切り替え: 現在のページ ${currentPageIndex} (配列インデックス ${currentPageArrayIndex}), 新しいページ ${index}`);
      
      // 現在のページ内容を更新（エラー回避のためのチェック追加）
      if (currentPageArrayIndex >= 0 && currentPageArrayIndex < updatedPages.length) {
        updatedPages[currentPageArrayIndex].content = content;
        
        // 既存のメモの場合は、APIを使って現在のページ内容を更新してから切り替え
        if (memoId && memoId !== 'new') {
          (async () => {
            try {
              await updateMemoPage(Number(memoId), currentPageIndex, content);
              console.log(`ページ ${currentPageIndex} の内容を保存しました`);
              
              // ページの切り替え後にAPIから最新のデータを取得する
              const newPageArrayIndex = index - 1;
              if (newPageArrayIndex >= 0 && newPageArrayIndex < updatedPages.length) {
                try {
                  // APIから最新のページデータを取得
                  const latestPage = await getMemoPage(Number(memoId), index);
                  if (latestPage) {
                    // 最新のページデータで更新
                    updatedPages[newPageArrayIndex] = latestPage;
                    setPages(updatedPages);
                    
                    // ページの切り替えを実行
                    setCurrentPageIndex(index);
                    setContent(latestPage.content || '');
                    return; // 成功したら早期リターン
                  }
                } catch (fetchError) {
                  console.error('最新ページデータの取得に失敗:', fetchError);
                  // エラー時は通常のフロー続行（下記のコード）
                }
              }
            } catch (error) {
              console.error('ページ内容の更新に失敗しました:', error);
            }
          })();
          return; // 非同期処理を開始したので関数を終了
        }
      }
      
      // ページデータを更新
      setPages(updatedPages);
      
      // 新しいページに切り替え
      const newPageArrayIndex = index - 1; // 1ベースから0ベースのインデックスに変換
      
      // 新しいページの内容を取得（エラー回避のためのチェック追加）
      if (newPageArrayIndex >= 0 && newPageArrayIndex < updatedPages.length) {
        const pageContent = updatedPages[newPageArrayIndex]?.content || '';
        console.log(`新しいページのインデックス: ${newPageArrayIndex}, 内容:`, updatedPages[newPageArrayIndex]);
        
        // ページの切り替えを実行
        setCurrentPageIndex(index);
        setContent(pageContent);
      } else {
        console.warn(`新しいページインデックス ${newPageArrayIndex} がページ配列の範囲外です`);
      }
    } catch (error) {
      console.error('ページ切り替え時にエラーが発生しました:', error);
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

      <div className="container mx-auto px-4 flex justify-center">
        {/* ページ切り替えナビゲーション */}
        <div className="flex items-center justify-center bg-white rounded-lg shadow-md px-2 py-1.5 sm:px-3 sm:py-2 -mt-3 max-w-fit mx-auto">
          <button 
            onClick={() => handlePageChange(currentPageIndex - 1)}
            disabled={currentPageIndex === 1}
            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="前のページ"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </button>
          
          <div className="flex flex-col items-center mx-2 sm:mx-3">
            <span className="text-sm sm:text-base font-medium text-gray-600">
              {currentPageIndex} / {totalPages}
            </span>
            <span className="text-xs text-gray-400">ページ</span>
          </div>
          
          <button 
            onClick={() => handlePageChange(currentPageIndex + 1)}
            disabled={currentPageIndex >= totalPages}
            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="次のページ"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </button>
          
          <div className="pl-1.5 sm:pl-3 ml-0.5 sm:ml-1 border-l border-gray-200">
            <button
              onClick={handleAddPage}
              disabled={totalPages >= 10}
              className="p-1.5 sm:p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-30 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              title={totalPages >= 10 ? "最大ページ数に達しました" : "新規ページを追加"}
              aria-label="ページ追加"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 pb-6 pt-6">
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
