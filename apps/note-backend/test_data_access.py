"""
データアクセス制御のテストスクリプト

このスクリプトは以下のデータアクセス制御機能をテストします：
1. 認証済みユーザーの自分のデータへのアクセス
2. 他ユーザーのデータへのアクセス制限
3. リソース作成時のユーザーID設定

注意：このテストを実行する前に、有効なFirebaseトークンが必要です。
また、テスト用のデータベースを使用することを強く推奨します。
"""

import unittest
import requests
import os
import logging
import json
import sys
import time
import random

# プロジェクトのルートディレクトリをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# テスト用のAPIエンドポイント
API_URL = os.getenv('TEST_API_URL', 'http://localhost:5000/api')

# テスト用の有効なトークン（実行前に設定が必要）
VALID_TOKEN = os.getenv('TEST_FIREBASE_TOKEN', '')

# 別のテスト用トークン（別ユーザー）
OTHER_TOKEN = os.getenv('TEST_OTHER_TOKEN', '')

class TestDataAccess(unittest.TestCase):
    """データアクセス制御のテストクラス"""
    
    @classmethod
    def setUpClass(cls):
        """テストクラス全体の前処理"""
        # テストIDの生成（ランダム値を使用して一意にする）
        cls.test_id = f"test_{int(time.time())}_{random.randint(1000, 9999)}"
        cls.created_note_id = None
        
        if not VALID_TOKEN:
            logger.warning("有効なテストトークンが設定されていません。テストはスキップされます。")
            return
            
        if not OTHER_TOKEN:
            logger.warning("別ユーザー用のテストトークンが設定されていません。一部のテストはスキップされます。")
    
    def setUp(self):
        """各テストケースの前処理"""
        # テストが実行できるか確認
        if not VALID_TOKEN:
            self.skipTest("有効なテストトークンが設定されていません")
    
    @unittest.skipIf(not VALID_TOKEN, "有効なテストトークンが設定されていません")
    def test_01_create_note(self):
        """ノート作成とユーザーID紐付けのテスト"""
        note_data = {
            "title": f"テストノート {self.test_id}",
            "main_category": "テスト",
            "sub_category": "自動テスト"
        }
        
        response = requests.post(
            f"{API_URL}/notes",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'},
            json=note_data
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIsNotNone(data.get('id'))
        self.assertEqual(data.get('title'), note_data['title'])
        
        # 作成したノートIDを保存
        TestDataAccess.created_note_id = data.get('id')
        logger.info(f"テストノート作成: ID={TestDataAccess.created_note_id}")
    
    @unittest.skipIf(not VALID_TOKEN, "有効なテストトークンが設定されていません")
    def test_02_get_own_notes(self):
        """自分のノート一覧取得テスト"""
        response = requests.get(
            f"{API_URL}/notes",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'}
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        
        # 作成したノートが含まれているか確認
        if TestDataAccess.created_note_id:
            found = False
            for note in data:
                if note.get('id') == TestDataAccess.created_note_id:
                    found = True
                    break
            self.assertTrue(found, "作成したノートが一覧に含まれていません")
    
    @unittest.skipIf(not VALID_TOKEN, "有効なテストトークンが設定されていません")
    def test_03_get_own_note(self):
        """自分のノート取得テスト"""
        if not TestDataAccess.created_note_id:
            self.skipTest("ノートが作成されていません")
            
        response = requests.get(
            f"{API_URL}/notes/{TestDataAccess.created_note_id}",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'}
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('id'), TestDataAccess.created_note_id)
    
    @unittest.skipIf(not VALID_TOKEN or not OTHER_TOKEN, "テストトークンが不足しています")
    def test_04_other_user_access_restriction(self):
        """他ユーザーのノートアクセス制限テスト"""
        if not TestDataAccess.created_note_id:
            self.skipTest("ノートが作成されていません")
            
        response = requests.get(
            f"{API_URL}/notes/{TestDataAccess.created_note_id}",
            headers={'Authorization': f'Bearer {OTHER_TOKEN}'}
        )
        
        # レスポンスの検証（アクセス拒否）
        self.assertEqual(response.status_code, 403)
    
    @unittest.skipIf(not VALID_TOKEN, "有効なテストトークンが設定されていません")
    def test_05_update_note(self):
        """ノート更新テスト"""
        if not TestDataAccess.created_note_id:
            self.skipTest("ノートが作成されていません")
            
        update_data = {
            "title": f"更新されたテストノート {self.test_id}",
            "main_category": "テスト更新",
            "sub_category": "自動テスト更新"
        }
        
        response = requests.put(
            f"{API_URL}/notes/{TestDataAccess.created_note_id}",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'},
            json=update_data
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('title'), update_data['title'])
    
    @unittest.skipIf(not VALID_TOKEN or not OTHER_TOKEN, "テストトークンが不足しています")
    def test_06_other_user_update_restriction(self):
        """他ユーザーのノート更新制限テスト"""
        if not TestDataAccess.created_note_id:
            self.skipTest("ノートが作成されていません")
            
        update_data = {
            "title": "不正な更新",
            "main_category": "不正",
            "sub_category": "不正"
        }
        
        response = requests.put(
            f"{API_URL}/notes/{TestDataAccess.created_note_id}",
            headers={'Authorization': f'Bearer {OTHER_TOKEN}'},
            json=update_data
        )
        
        # レスポンスの検証（アクセス拒否）
        self.assertEqual(response.status_code, 403)
    
    @unittest.skipIf(not VALID_TOKEN, "有効なテストトークンが設定されていません")
    def test_07_add_page(self):
        """ページ追加テスト"""
        if not TestDataAccess.created_note_id:
            self.skipTest("ノートが作成されていません")
            
        page_data = {
            "content": "テストページの内容",
            "page_number": 1
        }
        
        response = requests.post(
            f"{API_URL}/notes/{TestDataAccess.created_note_id}/pages",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'},
            json=page_data
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 201)
    
    @unittest.skipIf(not VALID_TOKEN or not OTHER_TOKEN, "テストトークンが不足しています")
    def test_08_other_user_add_page_restriction(self):
        """他ユーザーのページ追加制限テスト"""
        if not TestDataAccess.created_note_id:
            self.skipTest("ノートが作成されていません")
            
        page_data = {
            "content": "不正なページ",
            "page_number": 2
        }
        
        response = requests.post(
            f"{API_URL}/notes/{TestDataAccess.created_note_id}/pages",
            headers={'Authorization': f'Bearer {OTHER_TOKEN}'},
            json=page_data
        )
        
        # レスポンスの検証（アクセス拒否）
        self.assertEqual(response.status_code, 403)
    
    @unittest.skipIf(not VALID_TOKEN, "有効なテストトークンが設定されていません")
    def test_09_delete_note(self):
        """ノート削除テスト"""
        if not TestDataAccess.created_note_id:
            self.skipTest("ノートが作成されていません")
            
        response = requests.delete(
            f"{API_URL}/notes/{TestDataAccess.created_note_id}",
            headers={'Authorization': f'Bearer {VALID_TOKEN}'}
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 204)

def run_tests():
    """テストを実行する関数"""
    # 警告メッセージの表示
    print("====== 注意 ======")
    print("このテストは実際のデータベースに変更を加えます。")
    print("テスト用のデータベースを使用することを強く推奨します。")
    print("テストはノートの作成と削除を行います。")
    print("=================\n")
    
    # テストトークンの確認
    if not VALID_TOKEN:
        logger.error("有効なテストトークンが設定されていません。テストを実行できません。")
        logger.info("テストトークンを環境変数 TEST_FIREBASE_TOKEN に設定してください。")
        return
        
    if not OTHER_TOKEN:
        logger.warning("別ユーザー用のテストトークンが設定されていません。一部のテストはスキップされます。")
        logger.info("別ユーザー用のテストトークンを環境変数 TEST_OTHER_TOKEN に設定してください。")
    
    # テストの実行
    unittest.main()

if __name__ == "__main__":
    run_tests() 