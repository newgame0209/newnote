import os
import json
import firebase_admin
from firebase_admin import credentials, auth
import logging

logger = logging.getLogger(__name__)

def initialize_firebase_admin():
    """
    Firebase Admin SDKを初期化する関数
    環境変数からサービスアカウントの認証情報を読み込む
    """
    try:
        # 環境変数からサービスアカウントの認証情報を取得
        firebase_credentials_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
        
        if not firebase_credentials_json:
            logger.error("FIREBASE_SERVICE_ACCOUNT_KEY 環境変数が設定されていません")
            raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY 環境変数が設定されていません")
        
        # JSONとして読み込む
        try:
            cred_dict = json.loads(firebase_credentials_json)
            cred = credentials.Certificate(cred_dict)
        except json.JSONDecodeError:
            # 環境変数がファイルパスの場合
            if os.path.exists(firebase_credentials_json):
                cred = credentials.Certificate(firebase_credentials_json)
            else:
                logger.error("Firebase認証情報の解析に失敗しました")
                raise ValueError("Firebase認証情報の解析に失敗しました")
        
        # Firebase Adminの初期化
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDKの初期化に成功しました")
        
    except Exception as e:
        logger.error(f"Firebase Admin SDKの初期化に失敗しました: {str(e)}")
        raise

# トークンを検証する関数
def verify_firebase_token(id_token):
    """
    Firebaseのトークンを検証する関数
    
    Args:
        id_token (str): Firebaseの認証トークン
        
    Returns:
        dict: デコードされたトークンの情報
        
    Raises:
        ValueError: トークンが無効な場合
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"トークン検証エラー: {str(e)}")
        raise ValueError(f"トークンの検証に失敗しました: {str(e)}")

# 初期化を実行
try:
    initialize_firebase_admin()
except Exception as e:
    logger.error(f"Firebase初期化エラー: {str(e)}") 