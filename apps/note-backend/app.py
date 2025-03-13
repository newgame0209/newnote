from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import init_db, get_db
from models import Note
import os
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
import logging
import json
from datetime import timedelta

# .envファイルから環境変数を読み込む
load_dotenv()

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
    
    # JWT設定
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    jwt = JWTManager(app)

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
    from routes.auth import auth_bp
    app.register_blueprint(notes_bp, url_prefix='/api')
    app.register_blueprint(bookmarks_bp, url_prefix='/api')
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
