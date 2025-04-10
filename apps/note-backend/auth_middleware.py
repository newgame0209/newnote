from functools import wraps
from flask import request, jsonify
import logging
from firebase_service import verify_firebase_token

logger = logging.getLogger(__name__)

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