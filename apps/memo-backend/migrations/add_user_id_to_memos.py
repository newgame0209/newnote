"""
Memoテーブルにuser_idカラムを追加するマイグレーションスクリプト
"""
from sqlalchemy import Column, String
from alembic import op
import sqlalchemy as sa
from database import init_db, get_db
import sys
import os

# モデルをインポートするためにパスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.memo import Memo

def upgrade():
    """
    アップグレード処理: user_idカラムを追加
    """
    try:
        # SQLAlchemyの接続を取得
        engine = get_db()
        
        # user_idカラムが存在しない場合のみ追加
        inspector = sa.inspect(engine)
        columns = [c['name'] for c in inspector.get_columns('memos')]
        
        if 'user_id' not in columns:
            op.add_column('memos', sa.Column('user_id', sa.String(128), nullable=True))
            print("memos テーブルに user_id カラムを追加しました")
        else:
            print("user_id カラムはすでに存在します")
            
    except Exception as e:
        print(f"マイグレーションエラー: {str(e)}")
        raise

def downgrade():
    """
    ダウングレード処理: user_idカラムを削除
    """
    try:
        op.drop_column('memos', 'user_id')
        print("memos テーブルから user_id カラムを削除しました")
    except Exception as e:
        print(f"ダウングレードエラー: {str(e)}")
        raise

if __name__ == "__main__":
    # データベース接続の初期化
    init_db()
    
    # マイグレーションの実行
    upgrade() 