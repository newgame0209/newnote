from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class MemoPage(Base):
    """
    @docs
    メモのページを表すモデル
    ページ番号は各メモごとに一意である必要があります
    """
    __tablename__ = 'memo_pages'
    
    # ページ番号とメモIDの組み合わせに一意性制約を設定
    __table_args__ = (
        UniqueConstraint('memo_id', 'page_number', name='uix_memo_page_number'),
        Index('idx_memo_page_lookup', 'memo_id', 'page_number'),
    )

    id = Column(Integer, primary_key=True)
    memo_id = Column(Integer, ForeignKey('memos.id', ondelete='CASCADE'), nullable=False)
    page_number = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # リレーションシップ
    memo = relationship("Memo", back_populates="pages")
    
    def __repr__(self):
        return f"<MemoPage(id={self.id}, memo_id={self.memo_id}, page_number={self.page_number})>"
