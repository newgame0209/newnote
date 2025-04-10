from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from database import init_db, get_db
from models import Note
import os
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
import logging
import json
from datetime import datetime
from auth_middleware import require_auth

# Firebase Adminの初期化（インポートするだけで初期化される）
import firebase_admin
from firebase_admin import auth as firebase_auth

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
        try:
            with open(temp_credentials_path, 'w') as f:
                f.write(credentials_json)
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_credentials_path
            logging.info("Google Cloud認証情報を設定しました")
        except Exception as e:
            logging.error(f"Google Cloud認証情報の設定に失敗しました: {str(e)}")
            raise

    app = Flask(__name__)
    
    # デバッグモードを環境変数から設定
    app.debug = os.getenv('APP_DEBUG', 'false').lower() == 'true'

    # 許可するオリジンのリスト（環境変数から取得またはデフォルト値）
    allowed_origins = os.getenv('CORS_ORIGINS', 'https://mynote-psi-three.vercel.app,http://localhost:3000')
    allowed_origins_list = [origin.strip() for origin in allowed_origins.split(',')]
    
    # CORSの設定 - より柔軟に対応
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": allowed_origins_list,
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
        origin = request.headers.get('Origin')
        if origin and origin in allowed_origins_list:
            response.headers.add('Access-Control-Allow-Origin', origin)
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
            "status": "running",
            "auth": "enabled"
        })

    # ヘルスチェックエンドポイント
    @app.route('/health')
    def health_check():
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        })

    # Firebase認証状態チェック用エンドポイント
    @app.route('/api/auth/check', methods=['GET'])
    def auth_check():
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'authenticated': False, 'message': '認証情報がありません'}), 401
        
        token = auth_header.split('Bearer ')[1]
        
        try:
            # Firebaseでトークンを検証
            decoded_token = firebase_auth.verify_id_token(token)
            return jsonify({
                'authenticated': True,
                'user': {
                    'uid': decoded_token['uid'],
                    'email': decoded_token.get('email'),
                    'name': decoded_token.get('name')
                }
            })
        except Exception as e:
            logging.error(f"トークン検証エラー: {str(e)}")
            return jsonify({'authenticated': False, 'message': 'トークンが無効です'}), 401

    # 認証済みユーザー情報取得エンドポイント
    @app.route('/api/auth/me', methods=['GET'])
    @require_auth
    def get_user_info():
        try:
            # トークンからユーザー情報を取得
            user_id = request.firebase_token.get('uid')
            email = request.firebase_token.get('email')
            name = request.firebase_token.get('name', '')
            
            return jsonify({
                'user': {
                    'uid': user_id,
                    'email': email,
                    'name': name,
                    'authenticated': True
                }
            })
        except Exception as e:
            logging.error(f"ユーザー情報取得エラー: {str(e)}")
            return jsonify({'error': 'ユーザー情報の取得に失敗しました'}), 500

    # APIルートの登録
    from routes import notes_bp, bookmarks_bp
    app.register_blueprint(notes_bp, url_prefix='/api')
    app.register_blueprint(bookmarks_bp, url_prefix='/api')

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
