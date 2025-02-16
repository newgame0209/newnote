from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class Memo(Base):
    __tablename__ = 'memos'

    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False, default='無題')
    content = Column(Text, nullable=True)
    main_category = Column(String(50), nullable=True)
    sub_category = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
