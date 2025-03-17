from flask import Flask, jsonify, request, make_response, session
from flask_cors import CORS
from flask_session import Session as FlaskSession
from database import init_db, get_db, DATABASE_URL
from models import Note
import os
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
import logging
import json
import tempfile
import secrets

# .envファイルから環境変数を読み込む
load_dotenv()

# データベースURLをエクスポート（マイグレーションスクリプト用）
db_url = DATABASE_URL

def create_app():
    """
    @docs
    Flaskアプリケーションを作成し、設定を行う関数

    Returns:
        Flask: 設定済みのFlaskアプリケーション
    """
    # Google Cloud認証情報を環境変数から設定
    credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if credentials_json:
        # 一時ファイルに認証情報を書き出し
        temp_credentials_path = '/tmp/google_credentials.json'
        with open(temp_credentials_path, 'w') as f:
            f.write(credentials_json)
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_credentials_path

    app = Flask(__name__)
    
    # デバッグモードを環境変数から設定
    app.debug = os.getenv('APP_DEBUG', 'false').lower() == 'true'
    
    # セッション設定
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = tempfile.gettempdir()
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_USE_SIGNER'] = True
    app.config['SESSION_COOKIE_SECURE'] = not app.debug  # 本番環境ではSecure Cookie
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24時間
    
    # Supabase設定
    app.config['SUPABASE_URL'] = os.getenv('SUPABASE_URL')
    app.config['SUPABASE_ANON_KEY'] = os.getenv('SUPABASE_ANON_KEY')
    
    # セッション初期化
    FlaskSession(app)

    # CORSの設定 - より柔軟に対応
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": ["https://mynote-psi-three.vercel.app", "http://localhost:3000"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "*"],
                 "expose_headers": ["Content-Type"],
                 "max_age": 600,
                 "supports_credentials": True
             }
         })
    
    # CORS関連のエラーを解決するための追加設定
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', 'https://mynote-psi-three.vercel.app')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    # ログ設定
    if not os.path.exists('logs'):
        os.makedirs('logs')

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(message)s',
        handlers=[
            logging.FileHandler('logs/noteapp.log'),
            logging.StreamHandler()
        ]
    )

    # すべてのロガーのレベルをINFOに設定
    for logger_name in logging.root.manager.loggerDict:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.INFO)

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
    from routes import notes_bp, bookmarks_bp
    app.register_blueprint(notes_bp, url_prefix='/api')
    app.register_blueprint(bookmarks_bp, url_prefix='/api')
    
    # 認証ルートの登録
    from auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # エラーハンドラー
    @app.errorhandler(Exception)
    def handle_error(error):
        """
        エラーハンドラー
        """
        if isinstance(error, SQLAlchemyError):
            return jsonify({'message': 'データベースエラーが発生しました'}), 500
        logging.error(f"Error occurred: {error}")
        return jsonify({"error": str(error)}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5001)
