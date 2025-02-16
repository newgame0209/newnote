from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.memo import memo_bp

app = Flask(__name__)
CORS(app)

# APIルートの登録
app.register_blueprint(memo_bp, url_prefix='/api/memo')

# データベースの初期化
init_db()

if __name__ == '__main__':
    app.run(port=5002, debug=True)
