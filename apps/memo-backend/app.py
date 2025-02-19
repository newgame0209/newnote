from flask import Flask
from flask_cors import CORS
from routes.memo import memo_bp
from database import init_db, shutdown_session
import os

app = Flask(__name__)
app.url_map.strict_slashes = False

# CORSの設定
CORS(app, 
     resources={
         r"/api/*": {
             "origins": "*",  # すべてのオリジンを許可
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
             "expose_headers": ["Content-Type"],
             "max_age": 600,
             "supports_credentials": True
         }
     })

# Google Cloud認証情報のパスを設定
credentials_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'amiable-hour-446600-s5-accc791c2e4d.json')
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

# データベースの初期化
init_db()

# セッション管理の設定
app.teardown_appcontext(shutdown_session)

# APIルートの登録（プレフィックスを/api/memoに変更）
app.register_blueprint(memo_bp, url_prefix='/api/memo')

@app.errorhandler(500)
def handle_500_error(error):
    return {'error': 'Internal Server Error'}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
