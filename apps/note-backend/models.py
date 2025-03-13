from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt
from werkzeug.security import generate_password_hash, check_password_hash

Base = declarative_base()

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
        notes (relationship): ノートとの1対多のリレーション
        bookmarks (relationship): ブックマークとの1対多のリレーション
    """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128))
    nickname = Column(String(50), nullable=False)
    google_id = Column(String(100), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # リレーションシップ
    notes = relationship("Note", back_populates="user")
    
    def set_password(self, password):
        """パスワードをハッシュ化して保存する"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """パスワードが正しいかチェックする"""
        return check_password_hash(self.password_hash, password)

class Note(Base):
    """
    @docs
    ノートのメタデータを管理するテーブル

    Attributes:
        id (int): プライマリーキー
        user_id (int): 所有ユーザーのID（外部キー）
        title (str): ノートのタイトル
        main_category (str): メインカテゴリ
        sub_category (str): サブカテゴリ
        created_at (datetime): 作成日時
        updated_at (datetime): 更新日時
        user (relationship): ユーザーとの多対1のリレーション
        pages (relationship): ページとの1対多のリレーション
        bookmarks (relationship): ブックマークとの1対多のリレーション
    """
    __tablename__ = 'notes'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # 既存データのため一時的にnullable=True
    title = Column(String(100), nullable=False)
    main_category = Column(String(50), nullable=False)
    sub_category = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ユーザーテーブルとの多対1のリレーション
    user = relationship("User", back_populates="notes")
    
    # Pageテーブルとの1対多のリレーション
    pages = relationship("Page", back_populates="note", cascade="all, delete-orphan")
    
    # Bookmarkテーブルとの1対多のリレーション
    bookmarks = relationship("Bookmark", back_populates="note", cascade="all, delete-orphan")

class Page(Base):
    """
    @docs
    ノート内の各ページのデータを管理するテーブル

    Attributes:
        id (int): プライマリーキー
        note_id (int): 所属するノートのID（外部キー）
        page_number (int): ページ番号
        content (Text): ページの内容（キャンバスデータ）
        layout_settings (JSON): レイアウト設定（JSON形式）
        note (relationship): ノートとの多対1のリレーション
        bookmarks (relationship): ブックマークとの1対多のリレーション
    """
    __tablename__ = 'pages'

    id = Column(Integer, primary_key=True)
    note_id = Column(Integer, ForeignKey('notes.id'), nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text)  # キャンバスデータをJSON文字列として保存
    layout_settings = Column(JSON)  # レイアウト設定

    # Noteテーブルとの多対1のリレーション
    note = relationship("Note", back_populates="pages")
    
    # Bookmarkテーブルとの1対多のリレーション
    bookmarks = relationship("Bookmark", back_populates="page", cascade="all, delete-orphan")

class Bookmark(Base):
    """
    @docs
    ノート内のしおり（ブックマーク）を管理するテーブル
    
    Attributes:
        id (int): プライマリーキー
        note_id (int): 所属するノートのID（外部キー）
        page_id (int): 所属するページのID（外部キー）
        page_number (int): ページ番号
        position_x (int): キャンバス上のX座標位置（オプション）
        position_y (int): キャンバス上のY座標位置（オプション）
        title (str): しおりのタイトル（ページ番号がデフォルト）
        is_favorite (bool): お気に入りに設定されているかどうか
        created_at (datetime): 作成日時
        note (relationship): ノートとの多対1のリレーション
        page (relationship): ページとの多対1のリレーション
    """
    __tablename__ = 'bookmarks'
    
    id = Column(Integer, primary_key=True)
    note_id = Column(Integer, ForeignKey('notes.id'), nullable=False)
    page_id = Column(Integer, ForeignKey('pages.id'), nullable=False)
    page_number = Column(Integer, nullable=False)
    position_x = Column(Integer, nullable=True)
    position_y = Column(Integer, nullable=True)
    title = Column(String(100), nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Noteテーブルとの多対1のリレーション
    note = relationship("Note", back_populates="bookmarks")
    
    # Pageテーブルとの多対1のリレーション
    page = relationship("Page", back_populates="bookmarks")
