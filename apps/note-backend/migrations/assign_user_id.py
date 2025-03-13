"""
既存のノートに対してユーザーIDを設定するマイグレーションスクリプト

このスクリプトは、既存のノートデータのうち、user_idが設定されていないものに
デフォルトユーザーIDを設定します。
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
import os
import sys
import argparse

# 親ディレクトリをPythonパスに追加して、モジュールをインポートできるようにする
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from models import Note, User
from database import db_session

def migrate_notes(default_user_id=None):
    """
    user_idが設定されていないノートに対して、デフォルトユーザーIDを設定する
    
    Args:
        default_user_id: 設定するデフォルトユーザーID。指定がない場合は最初のユーザーを使用
    """
    print("ノートデータのマイグレーションを開始します...")
    
    try:
        # デフォルトユーザーIDが指定されていない場合は、最初のユーザーのIDを使用
        if default_user_id is None:
            default_user = db_session.query(User).first()
            if default_user:
                default_user_id = default_user.id
                print(f"デフォルトユーザーIDとして {default_user_id} (email: {default_user.email}) を使用します")
            else:
                print("ユーザーが見つかりません。マイグレーションを中止します。")
                return False
        
        # user_idがNULLのノートを取得
        null_user_notes = db_session.query(Note).filter(Note.user_id == None).all()
        total_count = len(null_user_notes)
        
        if total_count == 0:
            print("user_idが設定されていないノートはありません。処理を終了します。")
            return True
        
        print(f"user_idが設定されていないノートが {total_count} 件見つかりました。")
        
        # user_idを設定
        for i, note in enumerate(null_user_notes, 1):
            note.user_id = default_user_id
            print(f"処理中... ({i}/{total_count}): ノートID {note.id}, タイトル: {note.title}")
        
        # 変更をコミット
        db_session.commit()
        print(f"マイグレーション完了: {total_count} 件のノートにuser_id {default_user_id} を設定しました。")
        return True
    
    except Exception as e:
        db_session.rollback()
        print(f"エラーが発生しました: {str(e)}")
        return False
    finally:
        db_session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="既存のノートにユーザーIDを設定するマイグレーションスクリプト")
    parser.add_argument("--user-id", type=int, help="設定するデフォルトユーザーID")
    args = parser.parse_args()
    
    success = migrate_notes(args.user_id)
    if success:
        print("マイグレーションが正常に完了しました。")
    else:
        print("マイグレーションが失敗しました。")
        sys.exit(1)
