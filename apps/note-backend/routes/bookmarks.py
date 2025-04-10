from flask import jsonify, request, Blueprint
from database import Session
from models import Note, Page, Bookmark
from datetime import datetime
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import SQLAlchemyError
from logger import logger

# ブループリントの作成
bookmarks_bp = Blueprint('bookmarks', __name__)

class BookmarkError(Exception):
    """しおり操作に関するカスタム例外クラス"""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code

@bookmarks_bp.errorhandler(BookmarkError)
def handle_bookmark_error(error):
    """BookmarkErrorのハンドラー"""
    logger.error(f"BookmarkError: {str(error)}")
    return jsonify({'error': str(error)}), error.status_code

@bookmarks_bp.errorhandler(SQLAlchemyError)
def handle_db_error(error):
    """データベースエラーのハンドラー"""
    logger.error(f"Database error: {str(error)}")
    return jsonify({'error': 'データベース操作中にエラーが発生しました'}), 500

@bookmarks_bp.route('/notes/<int:note_id>/bookmarks', methods=['GET'])
def get_bookmarks(note_id):
    """指定されたノートのすべてのしおりを取得するエンドポイント"""
    try:
        logger.info(f"ノートID={note_id}のしおり一覧リクエストを受信")
        db = Session()
        
        # ノートの存在確認
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            logger.warning(f"ノートID={note_id}が見つかりません")
            raise BookmarkError(f'ノートID={note_id}が見つかりません', 404)
        
        # ノートに関連するしおりを取得
        bookmarks = db.query(Bookmark).filter(Bookmark.note_id == note_id).all()
        
        # しおりの情報をJSONに変換
        result = [{
            'id': bookmark.id,
            'note_id': bookmark.note_id,
            'page_id': bookmark.page_id,
            'page_number': bookmark.page_number,
            'position_x': bookmark.position_x,
            'position_y': bookmark.position_y,
            'title': bookmark.title or f'ページ {bookmark.page_number}',
            'is_favorite': bookmark.is_favorite,
            'created_at': bookmark.created_at.isoformat()
        } for bookmark in bookmarks]
        
        logger.info(f"ノートID={note_id}のしおり{len(result)}件を取得しました")
        return jsonify(result)
    
    except BookmarkError as e:
        raise e
    except Exception as e:
        logger.error(f"しおり一覧取得中にエラーが発生: {str(e)}")
        raise BookmarkError(f'しおり一覧の取得に失敗しました: {str(e)}', 500)

@bookmarks_bp.route('/notes/<int:note_id>/bookmarks', methods=['POST'])
def create_bookmark(note_id):
    """新しいしおりを作成するエンドポイント"""
    try:
        logger.info(f"ノートID={note_id}のしおり作成リクエストを受信")
        data = request.get_json()
        
        # 必須フィールドのバリデーション
        if not data or 'page_number' not in data:
            logger.warning("ページ番号が指定されていません")
            raise BookmarkError('ページ番号は必須です')
        
        db = Session()
        
        # ノートの存在確認
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            logger.warning(f"ノートID={note_id}が見つかりません")
            raise BookmarkError(f'ノートID={note_id}が見つかりません', 404)
        
        # ページの存在確認
        page_number = int(data['page_number'])
        page = db.query(Page).filter(
            Page.note_id == note_id, 
            Page.page_number == page_number
        ).first()
        
        if not page:
            logger.warning(f"ノートID={note_id}のページ{page_number}が見つかりません")
            raise BookmarkError(f'指定されたページが見つかりません', 404)
        
        # しおりの作成
        bookmark = Bookmark(
            note_id=note_id,
            page_id=page.id,
            page_number=page_number,
            position_x=data.get('position_x'),
            position_y=data.get('position_y'),
            title=data.get('title'),
            is_favorite=data.get('is_favorite', False)
        )
        
        db.add(bookmark)
        db.commit()
        
        result = {
            'id': bookmark.id,
            'note_id': bookmark.note_id,
            'page_id': bookmark.page_id,
            'page_number': bookmark.page_number,
            'position_x': bookmark.position_x,
            'position_y': bookmark.position_y,
            'title': bookmark.title or f'ページ {bookmark.page_number}',
            'is_favorite': bookmark.is_favorite,
            'created_at': bookmark.created_at.isoformat()
        }
        
        logger.info(f"ノートID={note_id}のページ{page_number}にしおりを作成しました: ID={bookmark.id}")
        return jsonify(result), 201
    
    except BookmarkError as e:
        raise e
    except Exception as e:
        logger.error(f"しおり作成中にエラーが発生: {str(e)}")
        raise BookmarkError(f'しおりの作成に失敗しました: {str(e)}', 500)

@bookmarks_bp.route('/notes/<int:note_id>/bookmarks/<int:bookmark_id>', methods=['GET'])
def get_bookmark(note_id, bookmark_id):
    """指定されたしおりを取得するエンドポイント"""
    try:
        logger.info(f"ノートID={note_id}のしおりID={bookmark_id}のリクエストを受信")
        db = Session()
        
        # しおりの存在確認と取得
        bookmark = db.query(Bookmark).filter(
            Bookmark.note_id == note_id,
            Bookmark.id == bookmark_id
        ).first()
        
        if not bookmark:
            logger.warning(f"ノートID={note_id}のしおりID={bookmark_id}が見つかりません")
            raise BookmarkError(f'指定されたしおりが見つかりません', 404)
        
        result = {
            'id': bookmark.id,
            'note_id': bookmark.note_id,
            'page_id': bookmark.page_id,
            'page_number': bookmark.page_number,
            'position_x': bookmark.position_x,
            'position_y': bookmark.position_y,
            'title': bookmark.title or f'ページ {bookmark.page_number}',
            'is_favorite': bookmark.is_favorite,
            'created_at': bookmark.created_at.isoformat()
        }
        
        logger.info(f"しおりID={bookmark_id}の情報を取得しました")
        return jsonify(result)
    
    except BookmarkError as e:
        raise e
    except Exception as e:
        logger.error(f"しおり取得中にエラーが発生: {str(e)}")
        raise BookmarkError(f'しおりの取得に失敗しました: {str(e)}', 500)

@bookmarks_bp.route('/notes/<int:note_id>/bookmarks/<int:bookmark_id>', methods=['PUT'])
def update_bookmark(note_id, bookmark_id):
    """指定されたしおりを更新するエンドポイント"""
    try:
        logger.info(f"ノートID={note_id}のしおりID={bookmark_id}の更新リクエストを受信")
        data = request.get_json()
        
        if not data:
            logger.warning("更新データが指定されていません")
            raise BookmarkError('更新データは必須です')
        
        db = Session()
        
        # しおりの存在確認と取得
        bookmark = db.query(Bookmark).filter(
            Bookmark.note_id == note_id,
            Bookmark.id == bookmark_id
        ).first()
        
        if not bookmark:
            logger.warning(f"ノートID={note_id}のしおりID={bookmark_id}が見つかりません")
            raise BookmarkError(f'指定されたしおりが見つかりません', 404)
        
        # 更新可能なフィールドの更新
        if 'title' in data:
            bookmark.title = data['title']
        if 'is_favorite' in data:
            bookmark.is_favorite = data['is_favorite']
        if 'position_x' in data:
            bookmark.position_x = data['position_x']
        if 'position_y' in data:
            bookmark.position_y = data['position_y']
        
        db.commit()
        
        result = {
            'id': bookmark.id,
            'note_id': bookmark.note_id,
            'page_id': bookmark.page_id,
            'page_number': bookmark.page_number,
            'position_x': bookmark.position_x,
            'position_y': bookmark.position_y,
            'title': bookmark.title or f'ページ {bookmark.page_number}',
            'is_favorite': bookmark.is_favorite,
            'created_at': bookmark.created_at.isoformat()
        }
        
        logger.info(f"しおりID={bookmark_id}を更新しました")
        return jsonify(result)
    
    except BookmarkError as e:
        raise e
    except Exception as e:
        logger.error(f"しおり更新中にエラーが発生: {str(e)}")
        raise BookmarkError(f'しおりの更新に失敗しました: {str(e)}', 500)

@bookmarks_bp.route('/notes/<int:note_id>/bookmarks/<int:bookmark_id>', methods=['DELETE'])
def delete_bookmark(note_id, bookmark_id):
    """指定されたしおりを削除するエンドポイント"""
    try:
        logger.info(f"ノートID={note_id}のしおりID={bookmark_id}の削除リクエストを受信")
        db = Session()
        
        # しおりの存在確認と取得
        bookmark = db.query(Bookmark).filter(
            Bookmark.note_id == note_id,
            Bookmark.id == bookmark_id
        ).first()
        
        if not bookmark:
            logger.warning(f"ノートID={note_id}のしおりID={bookmark_id}が見つかりません")
            raise BookmarkError(f'指定されたしおりが見つかりません', 404)
        
        # しおりの削除
        db.delete(bookmark)
        db.commit()
        
        logger.info(f"しおりID={bookmark_id}を削除しました")
        return jsonify({'message': 'しおりを削除しました'})
    
    except BookmarkError as e:
        raise e
    except Exception as e:
        logger.error(f"しおり削除中にエラーが発生: {str(e)}")
        raise BookmarkError(f'しおりの削除に失敗しました: {str(e)}', 500)
