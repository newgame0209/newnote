"""
@docs
認証関連のルートを定義するモジュール
"""
from flask import Blueprint, request, jsonify, current_app, redirect, url_for, session
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from sqlalchemy.exc import SQLAlchemyError
from database import get_db
from models import User
import logging
import datetime
import os
import requests
from werkzeug.security import generate_password_hash, check_password_hash

# BluePrintの設定
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    ユーザー登録API
    
    リクエストボディ:
        email: メールアドレス
        password: パスワード
        nickname: ニックネーム
    
    レスポンス:
        成功時: {"message": "ユーザー登録が完了しました", "user_id": user_id}
        失敗時: {"error": エラーメッセージ}
    """
    data = request.get_json()
    
    # 必須項目のチェック
    if not all(k in data for k in ['email', 'password', 'nickname']):
        return jsonify({"error": "必須項目（email, password, nickname）が不足しています"}), 400
    
    # メールアドレスの重複チェック
    db = get_db()
    existing_user = db.query(User).filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({"error": "このメールアドレスは既に登録されています"}), 409
    
    try:
        # ユーザーの作成
        new_user = User(
            email=data['email'],
            nickname=data['nickname']
        )
        
        # パスワードのハッシュ化
        password_hash = generate_password_hash(data['password'])
        new_user.password_hash = password_hash
        
        # DBに保存
        db.add(new_user)
        db.commit()
        
        return jsonify({
            "message": "ユーザー登録が完了しました", 
            "user_id": new_user.id
        }), 201
        
    except SQLAlchemyError as e:
        db.rollback()
        logging.error(f"データベースエラー: {str(e)}")
        return jsonify({"error": "データベースエラーが発生しました"}), 500
    except Exception as e:
        logging.error(f"ユーザー登録でエラー: {str(e)}")
        return jsonify({"error": "サーバーエラーが発生しました"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    ログインAPI
    
    リクエストボディ:
        email: メールアドレス
        password: パスワード
    
    レスポンス:
        成功時: {"access_token": アクセストークン, "refresh_token": リフレッシュトークン, "user": ユーザー情報}
        失敗時: {"error": エラーメッセージ}
    """
    data = request.get_json()
    
    # 必須項目のチェック
    if not all(k in data for k in ['email', 'password']):
        return jsonify({"error": "必須項目（email, password）が不足しています"}), 400
    
    try:
        # ユーザーの検索
        db = get_db()
        user = db.query(User).filter_by(email=data['email']).first()
        
        # ユーザーが存在しない、またはパスワードが一致しない場合
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({"error": "メールアドレスまたはパスワードが正しくありません"}), 401
        
        # トークンの発行（有効期限は1日）
        expires = datetime.timedelta(days=1)
        access_token = create_access_token(identity=user.id, expires_delta=expires)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "nickname": user.nickname
            }
        }), 200
        
    except Exception as e:
        logging.error(f"ログインでエラー: {str(e)}")
        return jsonify({"error": "サーバーエラーが発生しました"}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    トークンの更新API
    
    ヘッダー:
        Authorization: Bearer リフレッシュトークン
    
    レスポンス:
        成功時: {"access_token": 新しいアクセストークン}
        失敗時: {"error": エラーメッセージ}
    """
    try:
        # 現在のユーザーIDを取得
        current_user_id = get_jwt_identity()
        
        # 新しいアクセストークンの発行（有効期限は1日）
        expires = datetime.timedelta(days=1)
        new_access_token = create_access_token(identity=current_user_id, expires_delta=expires)
        
        return jsonify({"access_token": new_access_token}), 200
        
    except Exception as e:
        logging.error(f"トークン更新でエラー: {str(e)}")
        return jsonify({"error": "サーバーエラーが発生しました"}), 500

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_info():
    """
    ユーザー情報取得API
    
    ヘッダー:
        Authorization: Bearer アクセストークン
    
    レスポンス:
        成功時: ユーザー情報
        失敗時: {"error": エラーメッセージ}
    """
    try:
        # 現在のユーザーIDを取得
        current_user_id = get_jwt_identity()
        
        # ユーザー情報の取得
        db = get_db()
        user = db.query(User).filter_by(id=current_user_id).first()
        
        if not user:
            return jsonify({"error": "ユーザーが見つかりません"}), 404
        
        return jsonify({
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }), 200
        
    except Exception as e:
        logging.error(f"ユーザー情報取得でエラー: {str(e)}")
        return jsonify({"error": "サーバーエラーが発生しました"}), 500

@auth_bp.route('/google', methods=['GET'])
def google_auth():
    """
    Google認証の開始エンドポイント
    """
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    REDIRECT_URI = os.environ.get('FRONTEND_URL') + '/auth/google/callback'
    
    # Google認証URLの生成
    auth_url = (
        'https://accounts.google.com/o/oauth2/v2/auth'
        f'?client_id={GOOGLE_CLIENT_ID}'
        '&response_type=code'
        f'&redirect_uri={REDIRECT_URI}'
        '&scope=openid%20email%20profile'
    )
    
    return jsonify({"auth_url": auth_url})

@auth_bp.route('/google/callback', methods=['POST'])
def google_callback():
    """
    Google認証のコールバックエンドポイント
    
    リクエストボディ:
        code: Google認証コード
        
    レスポンス:
        成功時: {"access_token": アクセストークン, "refresh_token": リフレッシュトークン, "user": ユーザー情報}
        失敗時: {"error": エラーメッセージ}
    """
    data = request.get_json()
    if 'code' not in data:
        return jsonify({"error": "認証コードが不足しています"}), 400
    
    code = data['code']
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    REDIRECT_URI = os.environ.get('FRONTEND_URL') + '/auth/google/callback'
    
    try:
        # Google APIからトークンを取得
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'code': code,
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'redirect_uri': REDIRECT_URI,
            'grant_type': 'authorization_code'
        }
        
        token_response = requests.post(token_url, data=token_data)
        if token_response.status_code != 200:
            return jsonify({"error": "Googleトークン取得に失敗しました"}), 400
        
        token_json = token_response.json()
        access_token = token_json.get('access_token')
        
        # アクセストークンを使用してユーザー情報を取得
        user_info_url = 'https://www.googleapis.com/oauth2/v1/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        user_response = requests.get(user_info_url, headers=headers)
        
        if user_response.status_code != 200:
            return jsonify({"error": "Googleユーザー情報の取得に失敗しました"}), 400
        
        user_info = user_response.json()
        email = user_info.get('email')
        google_id = user_info.get('id')
        name = user_info.get('name')
        
        # データベースからユーザーを検索または作成
        db = get_db()
        user = db.query(User).filter_by(email=email).first()
        
        if not user:
            # 新規ユーザーの作成
            user = User(
                email=email,
                nickname=name,
                google_id=google_id
            )
            db.add(user)
            db.commit()
        elif not user.google_id:
            # 既存ユーザーにGoogle IDを追加
            user.google_id = google_id
            db.commit()
        
        # JWTトークンの発行
        expires = datetime.timedelta(days=1)
        app_access_token = create_access_token(identity=user.id, expires_delta=expires)
        app_refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            "access_token": app_access_token,
            "refresh_token": app_refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "nickname": user.nickname
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Google認証でエラー: {str(e)}")
        return jsonify({"error": "サーバーエラーが発生しました"}), 500
