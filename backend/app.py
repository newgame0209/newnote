from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from database import init_db, get_db
from models import Note
import os
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
import logging

# .envファイルから環境変数を読み込む
load_dotenv()

def create_app():
    """
    @docs
    Flaskアプリケーションを作成し、設定を行う関数

    Returns:
        Flask: 設定済みのFlaskアプリケーション
    """
    # Google Cloud認証情報のパスを設定
    credentials_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'amiable-hour-446600-s5-accc791c2e4d.json')
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

    app = Flask(__name__)
    app.debug = True  # デバッグモードを有効化

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

    # CORSヘッダーを全てのレスポンスに追加
    @app.after_request
    def after_request(response):
        logging.info(f"Request method: {request.method}")
        logging.info(f"Request headers: {request.headers}")
        
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        
        if request.method == 'OPTIONS':
            return make_response()
        return response

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

    # ノート一覧取得API
    @app.route('/api/notes', methods=['GET'])
    def get_notes():
        """
        ノート一覧を取得するエンドポイント
        """
        try:
            db = get_db()
            notes = db.query(Note).order_by(Note.updated_at.desc()).all()
            return jsonify([{
                'id': str(note.id),
                'title': note.title,
                'main_category': note.main_category,
                'sub_category': note.sub_category,
                'created_at': note.created_at.isoformat(),
                'updated_at': note.updated_at.isoformat()
            } for note in notes]), 200
        except Exception as e:
            logging.error(f"Error fetching notes: {str(e)}")
            return jsonify({'message': 'ノート一覧の取得に失敗しました'}), 500
        finally:
            db.close()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5001)
