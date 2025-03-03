import axios from 'axios';

interface OCRRequest {
  image: string;  // base64
}

interface OCRResponse {
  text: string;
}

/**
 * 画像を圧縮する
 * @param base64 元の画像データ（base64）
 * @param maxWidth 最大幅
 * @returns 圧縮された画像データ（base64）
 */
export const compressImage = async (base64: string, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // アスペクト比を保持しながらリサイズ
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
};

/**
 * OCR処理を実行する
 * @param noteId ノートID
 * @param pageNumber ページ番号
 * @param imageData 画像データ（base64）
 * @returns OCR結果のテキスト
 */
export const executeOCR = async (noteId: number, pageNumber: number, imageData: string): Promise<string> => {
  try {
    // 画像が大きい場合は警告
    if (imageData.length > 1024 * 1024) {  // 1MB以上
      console.warn('画像サイズが大きいため、処理に時間がかかる可能性があります');
    }

    // 画像を圧縮
    const compressedImage = await compressImage(imageData);

    const response = await axios.post<OCRResponse>(
      `/api/notes/${noteId}/pages/${pageNumber}/ocr`,
      { image: compressedImage }
    );

    return response.data.text;
  } catch (error) {
    console.error('OCR処理エラー:', error);
    throw new Error('OCR処理に失敗しました。もう一度お試しください。');
  }
};
