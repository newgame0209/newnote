from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from models import Base
import os
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

# データベースURLの設定（デフォルトはSQLite）
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./notes.db')

# エンジンの作成
engine = create_engine(DATABASE_URL)

# セッションファクトリの作成
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

def init_db():
    """
    @docs
    データベースの初期化を行う関数
    テーブルが存在しない場合は作成する
    """
    Base.metadata.create_all(engine)

def get_db():
    """
    @docs
    データベースセッションを取得する関数
    
    Returns:
        Session: データベースセッション
    """
    db = Session()
    try:
        yield db
    finally:
        db.close()
