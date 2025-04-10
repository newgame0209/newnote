"""
簡易的なバックエンド認証テスト

このスクリプトは、受け取ったFirebaseトークンが有効かどうかをテストします。
サービスアカウントキーは必要ありません。
"""

import os
import requests
import json
import logging

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# テスト用のAPIエンドポイント
API_URL = os.getenv('TEST_API_URL', 'http://localhost:5002/api')

# テスト用の有効なトークン（実行前に設定が必要）
VALID_TOKEN = os.getenv('TEST_FIREBASE_TOKEN', '')

def test_token_validation():
    """トークン検証テスト"""
    if not VALID_TOKEN:
        logger.error("環境変数 TEST_FIREBASE_TOKEN が設定されていません")
        logger.info("例: export TEST_FIREBASE_TOKEN=<your_token>")
        return False

    # トークンを表示（デバッグ用）
    logger.info(f"トークンの先頭20文字: {VALID_TOKEN[:20]}...")
    
    # トークンの検証をテスト
    headers = {
        'Authorization': f'Bearer {VALID_TOKEN}'
    }
    
    try:
        response = requests.get(f'{API_URL}/auth/check', headers=headers)
        
        # レスポンスを表示
        logger.info(f"ステータスコード: {response.status_code}")
        logger.info(f"レスポンス: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('authenticated'):
                logger.info("✅ トークン検証成功!")
                user_info = data.get('user', {})
                logger.info(f"ユーザーID: {user_info.get('uid')}")
                logger.info(f"メール: {user_info.get('email')}")
                
                # このユーザーIDを環境変数に設定することを推奨
                logger.info(f"\n以下のコマンドを実行してユーザーIDを環境変数に設定してください:")
                logger.info(f"export TEST_USER_ID={user_info.get('uid')}")
                
                return True
            else:
                logger.error("❌ トークン検証失敗: 認証されていません")
        else:
            logger.error(f"❌ トークン検証失敗: {response.status_code}")
            
    except requests.RequestException as e:
        logger.error(f"❌ リクエストエラー: {str(e)}")
        logger.info("バックエンドAPIサーバーが起動していることを確認してください")
    
    return False

def test_protected_endpoint():
    """保護されたエンドポイントアクセステスト"""
    if not VALID_TOKEN:
        logger.error("環境変数 TEST_FIREBASE_TOKEN が設定されていません")
        return False

    # トークンの検証をテスト
    headers = {
        'Authorization': f'Bearer {VALID_TOKEN}'
    }
    
    try:
        # ユーザー情報エンドポイントをテスト
        response = requests.get(f'{API_URL}/auth/me', headers=headers)
        
        # レスポンスを表示
        logger.info(f"保護されたエンドポイントステータスコード: {response.status_code}")
        logger.info(f"保護されたエンドポイントレスポンス: {response.text}")
        
        if response.status_code == 200:
            logger.info("✅ 保護されたエンドポイントアクセス成功!")
            return True
        else:
            logger.error(f"❌ 保護されたエンドポイントアクセス失敗: {response.status_code}")
            
    except requests.RequestException as e:
        logger.error(f"❌ リクエストエラー: {str(e)}")
    
    return False

if __name__ == "__main__":
    logger.info("===== 簡易バックエンド認証テスト開始 =====")
    
    # トークン検証テスト
    logger.info("\n1. トークン検証テスト実行中...")
    token_valid = test_token_validation()
    
    if token_valid:
        # 保護されたエンドポイントアクセステスト
        logger.info("\n2. 保護されたエンドポイントアクセステスト実行中...")
        test_protected_endpoint()
    
    logger.info("\n===== テスト完了 =====") 