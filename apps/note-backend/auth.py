"""
認証関連のルート
"""
from flask import Blueprint, request, jsonify, session, current_app
import os
import requests
import logging
from supabase import create_client, Client

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Supabaseクライアントを取得する"""
    url = current_app.config['SUPABASE_URL']
    key = current_app.config['SUPABASE_ANON_KEY']
    return create_client(url, key)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    ログイン処理
    
    リクエスト:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "メールアドレスとパスワードは必須です"}), 400
        
        # Supabaseで認証
        supabase = get_supabase_client()
        result = supabase.auth.sign_in_with_password({"email": email, "password": password})
        
        if 'error' in result:
            logger.error(f"ログインエラー: {result.get('error')}")
            return jsonify({"error": "認証に失敗しました"}), 401
        
        user = result['user']
        
        # セッションにユーザーIDを保存
        session['user_id'] = user.get('id')
        session['email'] = user.get('email')
        
        return jsonify({
            "success": True, 
            "user": {
                "id": user.get('id'),
                "email": user.get('email')
            }
        })
        
    except Exception as e:
        logger.error(f"ログイン処理中にエラーが発生しました: {str(e)}")
        return jsonify({"error": "ログイン処理中にエラーが発生しました"}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    ユーザー登録処理
    
    リクエスト:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "メールアドレスとパスワードは必須です"}), 400
        
        # Supabaseでユーザー登録
        supabase = get_supabase_client()
        result = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        
        if 'error' in result:
            logger.error(f"登録エラー: {result.get('error')}")
            return jsonify({"error": "登録に失敗しました"}), 400
        
        return jsonify({
            "success": True, 
            "message": "確認メールを送信しました。メールを確認してアカウントを有効化してください。"
        })
        
    except Exception as e:
        logger.error(f"登録処理中にエラーが発生しました: {str(e)}")
        return jsonify({"error": "登録処理中にエラーが発生しました"}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """ログアウト処理"""
    # セッションからユーザー情報を削除
    session.pop('user_id', None)
    session.pop('email', None)
    return jsonify({"success": True})

@auth_bp.route('/user', methods=['GET'])
def get_user():
    """現在のユーザー情報を取得"""
    if 'user_id' not in session:
        return jsonify({"authenticated": False}), 200
        
    return jsonify({
        "authenticated": True,
        "user": {
            "id": session.get('user_id'),
            "email": session.get('email')
        }
    })

@auth_bp.route('/google', methods=['POST'])
def google_auth():
    """
    Googleログイン処理
    
    リクエスト:
    {
        "token": "google-id-token"
    }
    """
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({"error": "トークンは必須です"}), 400
        
        # Supabaseを使用してGoogleトークンを検証
        supabase = get_supabase_client()
        result = supabase.auth.sign_in_with_idp({
            "provider": "google",
            "id_token": token
        })
        
        if 'error' in result:
            logger.error(f"Googleログインエラー: {result.get('error')}")
            return jsonify({"error": "認証に失敗しました"}), 401
        
        user = result['user']
        
        # セッションにユーザーIDを保存
        session['user_id'] = user.get('id')
        session['email'] = user.get('email')
        
        return jsonify({
            "success": True, 
            "user": {
                "id": user.get('id'),
                "email": user.get('email')
            }
        })
        
    except Exception as e:
        logger.error(f"Googleログイン処理中にエラーが発生しました: {str(e)}")
        return jsonify({"error": "Googleログイン処理中にエラーが発生しました"}), 500

@auth_bp.route('/google-callback', methods=['POST'])
def google_callback():
    """
    Google認証コールバック処理
    
    リクエスト:
    {
        "access_token": "supabase-access-token",
        "refresh_token": "supabase-refresh-token",
        "provider_token": "google-provider-token",
        "user": {
            "id": "user-id",
            "email": "user@example.com",
            ...
        }
    }
    """
    try:
        data = request.get_json()
        user_data = data.get('user')
        
        if not user_data or not user_data.get('id'):
            return jsonify({"error": "ユーザー情報が不足しています"}), 400
        
        # セッションにユーザーIDを保存
        session['user_id'] = user_data.get('id')
        session['email'] = user_data.get('email')
        
        return jsonify({
            "success": True, 
            "user": {
                "id": user_data.get('id'),
                "email": user_data.get('email')
            }
        })
        
    except Exception as e:
        logger.error(f"Google認証コールバック処理中にエラーが発生しました: {str(e)}")
        return jsonify({"error": "Google認証コールバック処理中にエラーが発生しました"}), 500
