"""
認証関連のエンドポイントを定義するモジュール
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
import logging
import requests
import json
import os

from database import db_session
from models.user import User

# Blueprintの作成
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    @docs
    新規ユーザー登録エンドポイント
    
    Request (JSON):
        email: ユーザーのメールアドレス
        username: ユーザー名
        password: パスワード
        
    Returns:
        201: 登録成功 - ユーザー情報とトークン
        400: リクエストデータが不正
        409: メールアドレスが既に使用されている
        500: サーバーエラー
    """
    try:
        # リクエストデータを取得
        data = request.get_json()
        
        if not data:
            return jsonify({"message": "データが提供されていません"}), 400
            
        # 必須フィールドの確認
        required_fields = ['email', 'password', 'username']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"message": f"{field}は必須です"}), 400
                
        email = data['email']
        password = data['password']
        username = data['username']
        
        # パスワードの長さチェック
        if len(password) < 8:
            return jsonify({"message": "パスワードは8文字以上である必要があります"}), 400
            
        # 既存ユーザーの確認
        existing_user = db_session.query(User).filter_by(email=email).first()
        if existing_user:
            return jsonify({"message": "このメールアドレスは既に使用されています"}), 409
            
        # 新規ユーザーの作成
        new_user = User(email=email, username=username)
        new_user.set_password(password)
        
        # DBに保存
        db_session.add(new_user)
        db_session.commit()
        
        # JWTトークンの生成
        access_token = create_access_token(
            identity=new_user.id,
            expires_delta=timedelta(days=1)
        )
        
        return jsonify({
            "message": "ユーザー登録が完了しました",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            },
            "token": access_token
        }), 201
        
    except IntegrityError as e:
        db_session.rollback()
        logging.error(f"データベース整合性エラー: {str(e)}")
        return jsonify({"message": "ユーザー登録に失敗しました"}), 400
        
    except Exception as e:
        db_session.rollback()
        logging.error(f"ユーザー登録エラー: {str(e)}")
        return jsonify({"message": "サーバーエラーが発生しました"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    @docs
    ユーザーログインエンドポイント
    
    Request (JSON):
        email: ユーザーのメールアドレス
        password: パスワード
        
    Returns:
        200: ログイン成功 - ユーザー情報とトークン
        400: リクエストデータが不正
        401: 認証失敗（メールまたはパスワードが間違っている）
        500: サーバーエラー
    """
    try:
        # リクエストデータを取得
        data = request.get_json()
        
        if not data:
            return jsonify({"message": "データが提供されていません"}), 400
            
        # 必須フィールドの確認
        if 'email' not in data or 'password' not in data:
            return jsonify({"message": "メールアドレスとパスワードは必須です"}), 400
            
        email = data['email']
        password = data['password']
        
        # ユーザーの検索
        user = db_session.query(User).filter_by(email=email).first()
        
        # ユーザーが存在しないか、パスワードが不一致
        if not user or not user.check_password(password):
            return jsonify({"message": "メールアドレスまたはパスワードが正しくありません"}), 401
            
        # JWTトークンの生成
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=1)
        )
        
        return jsonify({
            "message": "ログインに成功しました",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "token": access_token
        }), 200
        
    except Exception as e:
        logging.error(f"ログインエラー: {str(e)}")
        return jsonify({"message": "サーバーエラーが発生しました"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_user_profile():
    """
    @docs
    ログイン中のユーザー情報を取得するエンドポイント
    
    認証が必要: はい（JWTトークン）
    
    Returns:
        200: ユーザー情報
        401: 認証が必要
        404: ユーザーが見つからない
        500: サーバーエラー
    """
    try:
        # JWTからユーザーIDを取得
        user_id = get_jwt_identity()
        
        # ユーザーの検索
        user = db_session.query(User).filter_by(id=user_id).first()
        
        if not user:
            return jsonify({"message": "ユーザーが見つかりません"}), 404
            
        return jsonify({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 200
        
    except Exception as e:
        logging.error(f"プロフィール取得エラー: {str(e)}")
        return jsonify({"message": "サーバーエラーが発生しました"}), 500


@auth_bp.route('/google/callback', methods=['POST'])
def google_auth_callback():
    """
    @docs
    Google認証コールバックを処理するエンドポイント
    
    Request (JSON):
        code: Google認証から返されるコード
        
    Returns:
        200: 認証成功 - ユーザー情報とトークン
        400: 無効なリクエスト
        500: サーバーエラー
    """
    try:
        # リクエストデータを取得
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({"message": "認証コードが必要です"}), 400
        
        code = data['code']
        
        # Googleクライアント設定（環境変数から取得）
        client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
        client_secret = os.environ.get('GOOGLE_CLIENT_SECRET', '')
        
        # クライアントIDとシークレットが設定されていることを確認
        if not client_id or not client_secret:
            logging.error("Google OAuth認証情報が設定されていません")
            return jsonify({"message": "サーバー設定エラー"}), 500
        
        # リダイレクトURI（環境に応じて変更）
        # 開発環境か本番環境かに基づいて選択
        redirect_uri = os.environ.get(
            'GOOGLE_REDIRECT_URI', 
            'http://localhost:5173/auth/google/callback'
        )
        
        # トークンエンドポイントにリクエスト
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        if 'error' in token_json:
            logging.error(f"Googleトークン取得エラー: {token_json['error']}")
            return jsonify({"message": "Google認証に失敗しました"}), 400
        
        # アクセストークンを使用してユーザー情報を取得
        access_token = token_json.get('access_token')
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        user_info_response = requests.get(
            user_info_url,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_info = user_info_response.json()
        
        if 'error' in user_info:
            logging.error(f"Googleユーザー情報取得エラー: {user_info['error']}")
            return jsonify({"message": "ユーザー情報の取得に失敗しました"}), 400
        
        # 必要なユーザー情報を抽出
        email = user_info.get('email')
        if not email:
            return jsonify({"message": "メールアドレスが取得できませんでした"}), 400
        
        # ユーザーが存在するか確認
        user = db_session.query(User).filter_by(email=email).first()
        
        if not user:
            # 新規ユーザーを作成
            username = user_info.get('name', email.split('@')[0])
            user = User(email=email, username=username)
            # ランダムなパスワードを生成（ユーザーはGoogle認証でログインするため実質不要）
            import secrets
            random_password = secrets.token_hex(16)
            user.set_password(random_password)
            
            db_session.add(user)
            db_session.commit()
        
        # JWTトークンの生成
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=1)
        )
        
        return jsonify({
            "message": "Google認証に成功しました",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "token": access_token
        }), 200
        
    except Exception as e:
        logging.error(f"Google認証エラー: {str(e)}")
        return jsonify({"message": "サーバーエラーが発生しました"}), 500
