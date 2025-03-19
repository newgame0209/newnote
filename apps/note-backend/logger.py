import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logger():
    """
    ロギングの設定を行う関数

    Returns:
        logging.Logger: 設定済みのロガーインスタンス
    """
    # ロガーの作成
    logger = logging.getLogger('noteapp')
    logger.setLevel(logging.DEBUG)

    # ログ出力フォーマットの設定
    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(module)s:%(lineno)d - %(message)s'
    )

    # ファイルハンドラの設定（ログファイルはlogsディレクトリに保存）
    logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    file_handler = RotatingFileHandler(
        os.path.join(logs_dir, 'noteapp.log'),
        maxBytes=1024 * 1024,  # 1MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    # コンソールハンドラの設定
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # ハンドラをロガーに追加
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

# グローバルなロガーインスタンスを作成
logger = setup_logger()
