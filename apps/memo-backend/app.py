from flask import Flask, request
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

    # 許可するオリジンのリスト（環境変数から取得またはデフォルト値）
    allowed_origins = os.getenv('CORS_ORIGINS', 'https://mynote-psi-three.vercel.app,http://localhost:3000')
    allowed_origins_list = [origin.strip() for origin in allowed_origins.split(',')]
    
    # CORSの設定
    CORS(app, 
         resources={r"/api/*": {
             "origins": allowed_origins_list,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "*"],
             "expose_headers": ["Content-Type"],
             "max_age": 600,
             "supports_credentials": True
         }})
    
    # CORSエラー対策のための追加設定
    @app.after_request
    def after_request(response):
        # プリフライトリクエストの場合は200 OKを返す
        if request.method == 'OPTIONS':
            headers = {
                'Access-Control-Allow-Origin': request.headers.get('Origin', '*'),
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '600',
                'Access-Control-Allow-Credentials': 'true'
            }
            return app.response_class(status=200, headers=headers)
        
        # 通常のリクエストの場合
        origin = request.headers.get('Origin')
        if origin and origin in allowed_origins_list:
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    # グローバルOPTIONSハンドラ - 全てのAPIパスに対応
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        return '', 200

    # データベースの初期化
    init_db()

    # セッション管理の設定
    app.teardown_appcontext(shutdown_session)

    # APIルートの登録（プレフィックスを/api/memoに変更）
    app.register_blueprint(memo_bp, url_prefix='/api/memo')

    @app.route('/health')
    def health_check():
        return {'status': 'ok'}, 200

    @app.errorhandler(500)
    def handle_500_error(error):
        return {'error': 'Internal Server Error'}, 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5002)
