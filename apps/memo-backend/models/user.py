"""
@docs
ユーザー情報を管理するモデル
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(Base):
    """
    @docs
    ユーザー情報を管理するテーブル

    Attributes:
        id (int): プライマリーキー
        email (str): ユーザーのメールアドレス（一意）
        password_hash (str): ハッシュ化されたパスワード
        nickname (str): ユーザーのニックネーム
        google_id (str): Google認証用ID（オプション）
        is_active (bool): アカウントが有効かどうか
        created_at (datetime): 作成日時
        memos (relationship): メモとの1対多のリレーション
    """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128))
    nickname = Column(String(50), nullable=False)
    google_id = Column(String(100), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # リレーションシップ（memo.pyで定義するとcircular importになるため、メモ側でのみ定義）
    
    def set_password(self, password):
        """パスワードをハッシュ化して保存する"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """パスワードが正しいかチェックする"""
        return check_password_hash(self.password_hash, password)
