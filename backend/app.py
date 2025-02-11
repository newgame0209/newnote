from flask import Flask, jsonify
from flask_cors import CORS
from database import init_db
import os
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

def create_app():
    """
    @docs
    Flaskアプリケーションを作成し、設定を行う関数

    Returns:
        Flask: 設定済みのFlaskアプリケーション
    """
    app = Flask(__name__)

    # フロントエンド（localhost:3000）からのリクエストのみを許可
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type"]
        }
    })

    # データベースの初期化
    init_db()

    # ルートエンドポイント（動作確認用）
    @app.route('/')
    def index():
        return jsonify({
            "message": "しゃべるノート API サーバー",
            "status": "running"
        })

    # APIルートの登録
    from routes import notes_bp
    app.register_blueprint(notes_bp, url_prefix='/api')

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('BACKEND_PORT', 8000))  # デフォルトポートを8000に変更
    app.run(host='0.0.0.0', port=port, debug=True)
