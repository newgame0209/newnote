"""
ノートテーブルにuser_idカラムを追加するマイグレーションスクリプト
"""
from sqlalchemy import create_engine, MetaData, Table, Column, String, Index, text
import os
import sys

# プロジェクトのルートディレクトリをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# データベース接続設定
from app import db_url

def upgrade():
    """user_idカラムの追加とインデックスの作成"""
    engine = create_engine(db_url)
    metadata = MetaData()
    metadata.bind = engine
    
    # notesテーブルの取得
    notes = Table('notes', metadata, autoload_with=engine)
    
    # user_idカラムの追加
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE notes ADD COLUMN user_id VARCHAR(36)"))
        conn.execute(text("CREATE INDEX idx_notes_user_id ON notes(user_id)"))
        print("ノートテーブルにuser_idカラムとインデックスを追加しました。")

def downgrade():
    """user_idカラムとインデックスの削除"""
    engine = create_engine(db_url)
    
    with engine.begin() as conn:
        conn.execute(text("DROP INDEX IF EXISTS idx_notes_user_id"))
        conn.execute(text("ALTER TABLE notes DROP COLUMN IF EXISTS user_id"))
        print("ノートテーブルからuser_idカラムとインデックスを削除しました。")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法: python add_user_id.py [upgrade|downgrade]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    if command == "upgrade":
        upgrade()
    elif command == "downgrade":
        downgrade()
    else:
        print("無効なコマンドです。'upgrade'または'downgrade'を指定してください。")
        sys.exit(1)
