from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
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
        created_at (datetime): 作成日時
        updated_at (datetime): 更新日時
        pages (relationship): ページとの1対多のリレーション
    """
    __tablename__ = 'notes'

    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    main_category = Column(String(50), nullable=False)
    sub_category = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Pageテーブルとの1対多のリレーション
    pages = relationship("Page", back_populates="note", cascade="all, delete-orphan")

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
    """
    __tablename__ = 'pages'

    id = Column(Integer, primary_key=True)
    note_id = Column(Integer, ForeignKey('notes.id'), nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text)  # キャンバスデータをJSON文字列として保存
    layout_settings = Column(JSON)  # レイアウト設定

    # Noteテーブルとの多対1のリレーション
    note = relationship("Note", back_populates="pages")
