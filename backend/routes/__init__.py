from flask import Blueprint

# ノート関連のAPIエンドポイント用のブループリント
notes_bp = Blueprint('notes', __name__, url_prefix='/api')

# ルートの登録
from . import notes  # ノート管理API
from . import ocr    # OCR API
from . import tts    # TTS API
