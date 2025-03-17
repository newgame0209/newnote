from flask import Flask
from flask_cors import CORS
from routes.memo import memo_bp
from database import init_db, shutdown_session
import os

def create_app():
    """
    Flaskアプリケーションを作成し、設定を行う関数
    Returns:
        Flask: 設定済みのFlaskアプリケーション
    """
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # デバッグモードを環境変数から設定
    app.debug = os.getenv('DEBUG', 'false').lower() == 'true'

    # CORSの設定 - シンプルな単一設定に変更
    CORS(app, 
         origins=["https://mynote-psi-three.vercel.app", "http://localhost:3000"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
         supports_credentials=True)

    # Google Cloud認証情報のパスを設定
    credentials_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'amiable-hour-446600-s5-accc791c2e4d.json')
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

    # データベースの初期化
    init_db()

    # セッション管理の設定
    app.teardown_appcontext(shutdown_session)

    # APIルートの登録（プレフィックスを/api/memoに変更）
    app.register_blueprint(memo_bp, url_prefix='/api/memo')

    @app.route('/health')
    def health_check():
        return {'status': 'ok'}, 200

    # OPTIONSリクエストは flask-cors が自動処理するので個別に実装する必要はない

    @app.errorhandler(500)
    def handle_500_error(error):
        return {'error': 'Internal Server Error'}, 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5002)
