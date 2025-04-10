"""
バックエンド認証機能のテストスクリプト

このスクリプトは以下の認証機能をテストします：
1. トークン抽出
2. トークン検証
3. リソース所有権チェック
4. 保護されたエンドポイントへのアクセス

注意：このテストを実行する前に、有効なFirebaseトークンが必要です。
以下のいずれかの方法でトークンを取得してください：
- フロントエンドのテストスクリプトを実行して取得
- Firebaseコンソールから取得
- Firebase Admin SDKを使用して生成
"""

import unittest
import requests
import os
import logging
import json
from unittest import mock
from flask import Flask, request, jsonify
import sys

# プロジェクトのルートディレクトリをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# auth_middlewareをインポート
from auth_middleware import extract_token_from_request, require_auth, check_resource_ownership

# テスト用のAPIエンドポイント
API_URL = os.getenv('TEST_API_URL', 'http://localhost:5000/api')

# テスト用の有効なトークン（実行前に設定が必要）
# このトークンは、フロントエンドのテストスクリプトを実行して取得するか
# 環境変数から読み込みます
VALID_TOKEN = os.getenv('TEST_FIREBASE_TOKEN', '')

# テスト用のユーザーID（トークンに対応するユーザーID）
TEST_USER_ID = os.getenv('TEST_USER_ID', '')

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestAuthMiddleware(unittest.TestCase):
    """認証ミドルウェアのテストクラス"""
    
    def setUp(self):
        """テスト前の準備"""
        self.app = Flask(__name__)
        self.client = self.app.test_client()

    def test_token_extraction(self):
        """トークン抽出機能のテスト"""
        with self.app.test_request_context(headers={'Authorization': f'Bearer {VALID_TOKEN}'}):
            token = extract_token_from_request()
            self.assertEqual(token, VALID_TOKEN)
            
        with self.app.test_request_context(headers={'Authorization': 'InvalidFormat'}):
            token = extract_token_from_request()
            self.assertIsNone(token)
            
        with self.app.test_request_context():
            token = extract_token_from_request()
            self.assertIsNone(token)
    
    def test_resource_ownership(self):
        """リソース所有権チェック機能のテスト"""
        # モックのリクエストオブジェクトを作成
        with self.app.test_request_context():
            # トークンなしの場合
            result = check_resource_ownership(TEST_USER_ID)
            self.assertFalse(result)
            
        # トークンありの場合（同じユーザーID）
        with self.app.test_request_context():
            request.firebase_token = {'uid': TEST_USER_ID}
            result = check_resource_ownership(TEST_USER_ID)
            self.assertTrue(result)
            
        # トークンありの場合（異なるユーザーID）
        with self.app.test_request_context():
            request.firebase_token = {'uid': 'different_user_id'}
            result = check_resource_ownership(TEST_USER_ID)
            self.assertFalse(result)
    
    @unittest.skipIf(not VALID_TOKEN, "有効なテストトークンが設定されていません")
    def test_auth_check_endpoint(self):
        """認証状態チェックエンドポイントのテスト"""
        # 認証チェックエンドポイントにリクエスト
        response = requests.get(
            f"{API_URL}/auth/check",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'}
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('authenticated'))
        self.assertIsNotNone(data.get('user', {}).get('uid'))
        
        # 無効なトークンでリクエスト
        response = requests.get(
            f"{API_URL}/auth/check",
            headers={'Authorization': 'Bearer invalid_token'}
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data.get('authenticated'))
    
    @unittest.skipIf(not VALID_TOKEN, "有効なテストトークンが設定されていません")
    def test_protected_endpoint(self):
        """保護されたエンドポイントのテスト"""
        # 認証ありでリクエスト
        response = requests.get(
            f"{API_URL}/notes",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'}
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 200)
        
        # 認証なしでリクエスト
        response = requests.get(f"{API_URL}/notes")
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertEqual(data.get('code'), 'auth/missing-token')

    @unittest.skipIf(not VALID_TOKEN or not TEST_USER_ID, "有効なテストトークンとユーザーIDが設定されていません")
    def test_user_info_endpoint(self):
        """ユーザー情報取得エンドポイントのテスト"""
        response = requests.get(
            f"{API_URL}/auth/me",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'}
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('user', {}).get('uid'), TEST_USER_ID)

def run_tests():
    """テストを実行する関数"""
    # テストトークンが設定されているか確認
    if not VALID_TOKEN:
        logger.warning("テストトークンが設定されていません。一部のテストはスキップされます。")
        logger.info("テストトークンを環境変数 TEST_FIREBASE_TOKEN に設定してください。")
    
    if not TEST_USER_ID:
        logger.warning("テストユーザーIDが設定されていません。一部のテストはスキップされます。")
        logger.info("テストユーザーIDを環境変数 TEST_USER_ID に設定してください。")
    
    # テストの実行
    unittest.main()

if __name__ == "__main__":
    run_tests() 