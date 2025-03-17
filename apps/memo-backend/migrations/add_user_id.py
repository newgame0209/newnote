"""
メモテーブルにuser_idカラムを追加するマイグレーションスクリプト
"""
from sqlalchemy import create_engine, MetaData, Table, Column, String, Index, text, inspect
import os
import sys

# プロジェクトのルートディレクトリをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# データベース接続設定
from database import engine as db_engine
from models.memo import Memo

def upgrade():
    """user_idカラムの追加とインデックスの作成"""
    engine = db_engine
    inspector = inspect(engine)
    
    # テーブルが存在するか確認
    if not inspector.has_table('memos'):
        print("memosテーブルが存在しません。データベースを初期化します。")
        from database import Base, init_db
        init_db()
        print("データベースの初期化が完了しました。")
        return
    
    # user_idカラムが既に存在するか確認
    columns = [col['name'] for col in inspector.get_columns('memos')]
    if 'user_id' in columns:
        print("user_idカラムは既に存在します。")
        return
    
    # user_idカラムの追加
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE memos ADD COLUMN user_id VARCHAR(36)"))
        conn.execute(text("CREATE INDEX idx_memos_user_id ON memos(user_id)"))
        print("メモテーブルにuser_idカラムとインデックスを追加しました。")

def downgrade():
    """user_idカラムとインデックスの削除"""
    engine = db_engine
    inspector = inspect(engine)
    
    # テーブルが存在するか確認
    if not inspector.has_table('memos'):
        print("memosテーブルが存在しません。")
        return
    
    # user_idカラムが存在するか確認
    columns = [col['name'] for col in inspector.get_columns('memos')]
    if 'user_id' not in columns:
        print("user_idカラムは存在しません。")
        return
    
    with engine.begin() as conn:
        conn.execute(text("DROP INDEX IF EXISTS idx_memos_user_id"))
        conn.execute(text("ALTER TABLE memos DROP COLUMN IF EXISTS user_id"))
        print("メモテーブルからuser_idカラムとインデックスを削除しました。")

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
