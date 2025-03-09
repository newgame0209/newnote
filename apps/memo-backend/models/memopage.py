from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class MemoPage(Base):
    """
    @docs
    メモのページを表すモデル
    """
    __tablename__ = 'memo_pages'

    id = Column(Integer, primary_key=True)
    memo_id = Column(Integer, ForeignKey('memos.id', ondelete='CASCADE'), nullable=False)
    page_number = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # リレーションシップ
    memo = relationship("Memo", back_populates="pages")
