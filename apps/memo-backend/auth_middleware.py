from functools import wraps
from flask import request, jsonify
import logging
import firebase_admin
from firebase_admin import credentials, auth
import os
import json

logger = logging.getLogger(__name__)

# Firebase Admin初期化
try:
    default_app = firebase_admin.get_app()
except ValueError:
    # Firebase Adminが初期化されていない場合、環境変数から認証情報を取得
    firebase_creds_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
    
    if firebase_creds_json:
        try:
            # JSONとして解析
            cred_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDKを環境変数から初期化しました")
        except Exception as e:
            logger.error(f"Firebase認証情報の初期化に失敗しました: {str(e)}")
            raise
    else:
        logger.error("FIREBASE_SERVICE_ACCOUNT_KEY環境変数が設定されていません")
        raise ValueError("Firebase認証情報が見つかりません")

def extract_token_from_request():
    """
    リクエストヘッダーからBearerトークンを抽出する関数
    
    Returns:
        str: トークン文字列、見つからない場合はNone
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]

def require_auth(f):
    """
    認証を必要とするエンドポイントのためのデコレータ
    
    このデコレータは、リクエストからBearerトークンを抽出し、
    Firebaseで検証します。検証に失敗した場合は401か403エラーを返します。
    
    検証に成功した場合、デコード済みのトークンがリクエストオブジェクトの
    'firebase_token'属性として設定されます。
    
    Args:
        f: デコレートする関数
        
    Returns:
        decorated_function: 認証チェック付きの関数
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = extract_token_from_request()
        
        if not token:
            logger.warning("認証トークンがありません")
            return jsonify({'error': '認証が必要です', 'code': 'auth/missing-token'}), 401
        
        try:
            # トークンを検証
            decoded_token = verify_firebase_token(token)
            
            # トークンがリクエストに使用できるようにする
            request.firebase_token = decoded_token
            
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"トークンの検証に失敗しました: {str(e)}")
            return jsonify({'error': '無効なトークンです', 'code': 'auth/invalid-token'}), 401
        except Exception as e:
            logger.error(f"認証処理中にエラーが発生しました: {str(e)}")
            return jsonify({'error': 'サーバーエラーが発生しました', 'code': 'auth/server-error'}), 500
    
    return decorated_function

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

def check_resource_ownership(user_id):
    """
    リソースの所有権をチェックする関数
    
    リクエストに含まれるトークンから抽出したユーザーIDと、
    リソースに関連付けられたユーザーIDが一致するかチェックします。
    
    Args:
        user_id (str): リソースに関連付けられたユーザーID
        
    Returns:
        bool: 所有権があればTrue、なければFalse
    """
    # リクエストにトークン情報がない場合は所有権なし
    if not hasattr(request, 'firebase_token'):
        return False
    
    # トークンから抽出したユーザーID
    token_user_id = request.firebase_token.get('uid')
    
    # ユーザーIDが一致するか確認
    return token_user_id == user_id 