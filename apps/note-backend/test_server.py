"""
テスト用の簡易APIサーバー

認証関連のエンドポイントのみを実装した軽量なサーバーです。
テスト実行時にFirebase Admin SDKを使わずにトークン検証をシミュレートします。
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import os
import json

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# テスト用のユーザーID（環境変数から読み込み、デフォルトはテスト用ID）
TEST_USER_ID = os.getenv('TEST_USER_ID', 'SDsHqwNsk5UBAzdCsS707i1yOfu1')

# テスト用のメールアドレス
TEST_EMAIL = os.getenv('TEST_EMAIL', 'test@example.com')

# テスト用の有効なトークン
VALID_TOKEN = os.getenv('TEST_FIREBASE_TOKEN', '')

# 現在のディレクトリのパスを取得
current_dir = os.path.dirname(os.path.abspath(__file__))

# アプリケーション作成
app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({'status': 'ok'})

@app.route('/api/auth/check', methods=['GET'])
def auth_check():
    """認証状態チェックエンドポイント"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'authenticated': False, 'message': '認証情報がありません'}), 401
    
    token = auth_header.split('Bearer ')[1]
    
    # トークンが有効かチェック（テスト用なので単純に比較）
    if token == VALID_TOKEN:
        return jsonify({
            'authenticated': True,
            'user': {
                'uid': TEST_USER_ID,
                'email': TEST_EMAIL,
                'name': 'テストユーザー'
            }
        })
    else:
        logger.error(f"無効なトークン: {token[:20]}...")
        return jsonify({'authenticated': False, 'message': 'トークンが無効です'}), 401

@app.route('/api/auth/me', methods=['GET'])
def get_user_info():
    """ユーザー情報取得エンドポイント"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': '認証が必要です'}), 401
    
    token = auth_header.split('Bearer ')[1]
    
    # トークンが有効かチェック（テスト用なので単純に比較）
    if token == VALID_TOKEN:
        return jsonify({
            'user': {
                'uid': TEST_USER_ID,
                'email': TEST_EMAIL,
                'name': 'テストユーザー',
                'authenticated': True
            }
        })
    else:
        return jsonify({'error': '無効なトークンです'}), 401

@app.route('/api/notes', methods=['GET'])
def get_notes():
    """ノート一覧取得エンドポイント"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': '認証が必要です'}), 401
    
    token = auth_header.split('Bearer ')[1]
    
    # トークンが有効かチェック
    if token == VALID_TOKEN:
        # テスト用のダミーデータを返す
        return jsonify([
            {
                'id': 1,
                'title': 'テストノート1',
                'created_at': '2023-01-01T00:00:00',
                'updated_at': '2023-01-01T00:00:00',
                'user_id': TEST_USER_ID
            },
            {
                'id': 2,
                'title': 'テストノート2',
                'created_at': '2023-01-02T00:00:00',
                'updated_at': '2023-01-02T00:00:00',
                'user_id': TEST_USER_ID
            }
        ])
    else:
        return jsonify({'error': '無効なトークンです'}), 401

def validate_token_info():
    """起動時にトークン情報を検証"""
    if not VALID_TOKEN:
        logger.warning("テスト用トークンが設定されていません。テストが失敗する可能性があります。")
        logger.info("環境変数 TEST_FIREBASE_TOKEN を設定してください。")
    else:
        logger.info(f"テスト用トークンが設定されています。トークンの先頭20文字: {VALID_TOKEN[:20]}...")
    
    if not TEST_USER_ID:
        logger.warning("テスト用ユーザーIDが設定されていません。デフォルト値を使用します。")
    else:
        logger.info(f"テスト用ユーザーID: {TEST_USER_ID}")

if __name__ == '__main__':
    logger.info("==== テスト用APIサーバーを起動しています ====")
    validate_token_info()
    app.run(host='0.0.0.0', port=5002, debug=True) 