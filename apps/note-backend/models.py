from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Note(Base):
    """
    @docs
    ノートのメタデータを管理するテーブル

    Attributes:
        id (int): プライマリーキー
        title (str): ノートのタイトル
        main_category (str): メインカテゴリ
        sub_category (str): サブカテゴリ
        user_id (str): 所有者のユーザーID
        created_at (datetime): 作成日時
        updated_at (datetime): 更新日時
        pages (relationship): ページとの1対多のリレーション
        bookmarks (relationship): ブックマークとの1対多のリレーション
    """
    __tablename__ = 'notes'

    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    main_category = Column(String(50), nullable=False)
    sub_category = Column(String(50), nullable=False)
    user_id = Column(String(128), nullable=True)  # Firebaseユーザーのuidを保存
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
