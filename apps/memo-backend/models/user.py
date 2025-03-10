from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import bcrypt
import uuid
from database import Base

class User(Base):
    """
    @docs
    ユーザー情報を管理するテーブル

    Attributes:
        id (int): プライマリーキー
        username (str): ユーザー名
        email (str): メールアドレス
        password_hash (str): ハッシュ化されたパスワード
        created_at (datetime): 作成日時
        updated_at (datetime): 更新日時
        memos (relationship): ユーザーのメモ一覧
    """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Memoテーブルとの1対多のリレーション
    memos = relationship("Memo", back_populates="user", cascade="all, delete-orphan")
    
    def set_password(self, password: str) -> None:
        """
        パスワードをハッシュ化して保存する
        
        Args:
            password: 平文のパスワード
        """
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """
        パスワードが正しいか検証する
        
        Args:
            password: 検証する平文のパスワード
            
        Returns:
            bool: パスワードが一致すればTrue、それ以外はFalse
        """
        password_bytes = password.encode('utf-8')
        hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    
    @staticmethod
    def generate_reset_token() -> str:
        """
        パスワードリセット用のトークンを生成する
        
        Returns:
            str: 生成されたトークン
        """
        return str(uuid.uuid4())
