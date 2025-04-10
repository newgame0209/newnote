import cv2
import numpy as np
import io
import logging
import os

logger = logging.getLogger(__name__)

def preprocess_image(image_data: bytes) -> bytes:
    """
    画像の前処理を行う
    
    Args:
        image_data (bytes): 元の画像データ
    
    Returns:
        bytes: 処理済み画像データ
    """
    try:
        logger.info(f"元の画像データサイズ: {len(image_data)} bytes")
        
        # デバッグディレクトリの作成
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(debug_dir, exist_ok=True)
        
        # バイトデータをnumpy配列に変換
        logger.info("画像データをnumpy配列に変換中...")
        nparr = np.frombuffer(image_data, np.uint8)
        
        # デコード前のバイナリを保存
        with open(os.path.join(debug_dir, 'debug_raw.png'), 'wb') as f:
            f.write(image_data)
        
        # UNCHANGED で読み込んでチャネル数を確認
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError("画像のデコードに失敗しました")
        
        logger.info(f"画像サイズ: {img.shape}, データ型: {img.dtype}")
        cv2.imwrite(os.path.join(debug_dir, 'debug_1_decoded.png'), img)
        
        # グレースケールとして直接読み込み直す
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError("グレースケール画像のデコードに失敗しました")
            
        logger.info(f"グレースケール画像サイズ: {img.shape}")
        cv2.imwrite(os.path.join(debug_dir, 'debug_2_gray.png'), img)
        
        # ノイズ除去（メディアンフィルタ）
        logger.info("ノイズ除去中...")
        denoised = cv2.medianBlur(img, 3)
        cv2.imwrite(os.path.join(debug_dir, 'debug_3_denoised.png'), denoised)
        
        # 二値化処理（適応的閾値処理）
        logger.info("二値化処理中...")
        binary = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,  
            11,  
            2    
        )
        cv2.imwrite(os.path.join(debug_dir, 'debug_4_binary.png'), binary)
        
        # 形態学的処理
        logger.info("形態学的処理中...")
        kernel = np.ones((2,2), np.uint8)
        # クロージング（細い隙間を埋める）
        closing = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        cv2.imwrite(os.path.join(debug_dir, 'debug_5_closing.png'), closing)
        
        # 結果をバイト列に変換
        logger.info("処理済み画像をバイト列に変換中...")
        success, processed_image = cv2.imencode('.png', closing, [cv2.IMWRITE_PNG_COMPRESSION, 0])
        if not success:
            raise ValueError("画像のエンコードに失敗しました")
            
        processed_bytes = processed_image.tobytes()
        logger.info(f"処理後の画像データサイズ: {len(processed_bytes)} bytes")
        
        return processed_bytes
        
    except Exception as e:
        logger.error(f"画像処理中にエラーが発生: {str(e)}")
        raise
