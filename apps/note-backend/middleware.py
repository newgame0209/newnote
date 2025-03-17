"""
認証ミドルウェア
"""
from flask import session, g, jsonify
from functools import wraps

def auth_required(f):
    """
    認証が必要なエンドポイントに適用するデコレータ
    セッションにuser_idが存在するかチェックし、存在しない場合は401エラーを返す
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "認証が必要です"}), 401
            
        # ユーザーIDをグローバルコンテキストに設定
        g.user_id = session['user_id']
        return f(*args, **kwargs)
    return decorated_function
