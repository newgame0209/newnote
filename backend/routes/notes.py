from flask import jsonify, request
from . import notes_bp
from database import Session
from models import Note, Page
from datetime import datetime
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import SQLAlchemyError
from logger import logger

class NoteError(Exception):
    """ノート操作に関するカスタム例外クラス"""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code

@notes_bp.errorhandler(NoteError)
def handle_note_error(error):
    """NoteErrorのハンドラー"""
    logger.error(f"NoteError: {str(error)}")
    return jsonify({'error': str(error)}), error.status_code

@notes_bp.errorhandler(SQLAlchemyError)
def handle_db_error(error):
    """データベースエラーのハンドラー"""
    logger.error(f"Database error: {str(error)}")
    return jsonify({'error': 'データベース操作中にエラーが発生しました'}), 500

@notes_bp.route('/notes', methods=['POST'])
def create_note():
    """ノートを新規作成するエンドポイント"""
    try:
        logger.info("ノート作成リクエストを受信")
        data = request.get_json()
        
        # 必須フィールドのバリデーション
        if not data or 'title' not in data:
            logger.warning("タイトルが指定されていません")
            raise NoteError('タイトルは必須です')
            
        # 用紙サイズのバリデーション
        valid_paper_sizes = ['A4', 'A3', 'A7']
        paper_size = data.get('paper_size', 'A4')
        if paper_size not in valid_paper_sizes:
            logger.warning(f"無効な用紙サイズ: {paper_size}")
            raise NoteError(f'用紙サイズは{", ".join(valid_paper_sizes)}のいずれかを指定してください')
            
        # 向きのバリデーション
        valid_orientations = ['portrait', 'landscape']
        orientation = data.get('orientation', 'portrait')
        if orientation not in valid_orientations:
            logger.warning(f"無効な向き: {orientation}")
            raise NoteError('向きは縦（portrait）または横（landscape）を指定してください')
            
        # 色のバリデーション
        valid_colors = ['white', 'yellow']
        color = data.get('color', 'white')
        if color not in valid_colors:
            logger.warning(f"無効な色: {color}")
            raise NoteError('色は白（white）または黄色（yellow）を指定してください')
            
        # 最後に編集されたページの番号のバリデーション
        last_edited_page = data.get('last_edited_page', 1)
        if not isinstance(last_edited_page, int) or last_edited_page < 1:
            logger.warning(f"無効なページ番号: {last_edited_page}")
            raise NoteError('最後に編集されたページは1以上の整数を指定してください')
        
        db = Session()
        try:
            note = Note(
                title=data['title'],
                main_category=data.get('main_category', 'その他'),
                sub_category=data.get('sub_category', ''),
                paper_size=paper_size,
                orientation=orientation,
                color=color,
                last_edited_page=last_edited_page
            )
            db.add(note)
            db.commit()
            
            logger.info(f"ノートを作成しました: ID={note.id}")
            return jsonify({
                'note_id': note.id,
                'title': note.title,
                'main_category': note.main_category,
                'sub_category': note.sub_category,
                'paper_size': note.paper_size,
                'orientation': note.orientation,
                'color': note.color,
                'last_edited_page': note.last_edited_page,
                'created_at': note.created_at.isoformat(),
                'updated_at': note.updated_at.isoformat()
            }), 201
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"データベースエラー: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"予期せぬエラー: {str(e)}")
        if not isinstance(e, (NoteError, SQLAlchemyError)):
            return jsonify({'error': 'サーバーエラーが発生しました'}), 500
        raise

@notes_bp.route('/notes/<int:note_id>', methods=['GET'])
def get_note(note_id):
    """指定されたIDのノートを取得するエンドポイント"""
    logger.info(f"ノート取得リクエスト: ID={note_id}")
    db = Session()
    try:
        note = db.query(Note).options(joinedload(Note.pages)).filter(Note.id == note_id).first()
        
        if not note:
            logger.warning(f"ノートが見つかりません: ID={note_id}")
            raise NoteError('指定されたノートが見つかりません', 404)
            
        logger.info(f"ノートを取得しました: ID={note_id}")
        return jsonify({
            'id': note.id,
            'title': note.title,
            'main_category': note.main_category,
            'sub_category': note.sub_category,
            'paper_size': note.paper_size,
            'orientation': note.orientation,
            'color': note.color,
            'last_edited_page': note.last_edited_page,
            'created_at': note.created_at.isoformat(),
            'updated_at': note.updated_at.isoformat(),
            'pages': [{
                'id': page.id,
                'page_number': page.page_number,
                'content': page.content,
                'layout_settings': page.layout_settings
            } for page in note.pages]
        })
    except Exception as e:
        logger.error(f"エラー: {str(e)}")
        if not isinstance(e, (NoteError, SQLAlchemyError)):
            return jsonify({'error': 'サーバーエラーが発生しました'}), 500
        raise
    finally:
        db.close()

@notes_bp.route('/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    """指定されたIDのノートを更新するエンドポイント"""
    try:
        logger.info(f"ノート更新リクエスト: ID={note_id}")
        data = request.get_json()
        
        if not data:
            logger.warning("データが必要です")
            raise NoteError('データが必要です')
            
        db = Session()
        try:
            note = db.query(Note).filter(Note.id == note_id).first()
            
            if not note:
                logger.warning(f"ノートが見つかりません: ID={note_id}")
                raise NoteError('指定されたノートが見つかりません', 404)
                
            if 'title' in data:
                note.title = data['title']
            if 'main_category' in data:
                note.main_category = data['main_category']
            if 'sub_category' in data:
                note.sub_category = data['sub_category']
            if 'paper_size' in data:
                note.paper_size = data['paper_size']
            if 'orientation' in data:
                note.orientation = data['orientation']
            if 'color' in data:
                note.color = data['color']
            if 'last_edited_page' in data:
                note.last_edited_page = data['last_edited_page']
                
            note.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"ノートを更新しました: ID={note_id}")
            return jsonify({
                'id': note.id,
                'title': note.title,
                'main_category': note.main_category,
                'sub_category': note.sub_category,
                'paper_size': note.paper_size,
                'orientation': note.orientation,
                'color': note.color,
                'last_edited_page': note.last_edited_page,
                'created_at': note.created_at.isoformat(),
                'updated_at': note.updated_at.isoformat()
            })
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"データベースエラー: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"予期せぬエラー: {str(e)}")
        if not isinstance(e, (NoteError, SQLAlchemyError)):
            return jsonify({'error': 'サーバーエラーが発生しました'}), 500
        raise

@notes_bp.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """指定されたIDのノートを削除するエンドポイント"""
    try:
        logger.info(f"ノート削除リクエスト: ID={note_id}")
        db = Session()
        try:
            note = db.query(Note).filter(Note.id == note_id).first()
            
            if not note:
                logger.warning(f"ノートが見つかりません: ID={note_id}")
                raise NoteError('指定されたノートが見つかりません', 404)
                
            db.delete(note)
            db.commit()
            
            logger.info(f"ノートを削除しました: ID={note_id}")
            return jsonify({'message': 'ノートを削除しました'})
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"データベースエラー: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"予期せぬエラー: {str(e)}")
        if not isinstance(e, (NoteError, SQLAlchemyError)):
            return jsonify({'error': 'サーバーエラーが発生しました'}), 500
        raise

@notes_bp.route('/notes/<int:note_id>/pages', methods=['POST'])
def add_page(note_id):
    """指定されたノートに新しいページを追加するエンドポイント"""
    try:
        logger.info(f"ページ追加リクエスト: ノートID={note_id}")
        data = request.get_json()
        
        if not data:
            logger.warning("データが必要です")
            raise NoteError('データが必要です')
            
        db = Session()
        try:
            note = db.query(Note).filter(Note.id == note_id).first()
            
            if not note:
                logger.warning(f"ノートが見つかりません: ID={note_id}")
                raise NoteError('指定されたノートが見つかりません', 404)
                
            # 現在の最大ページ番号を取得
            max_page = db.query(Page).filter(Page.note_id == note_id).order_by(Page.page_number.desc()).first()
            next_page_number = (max_page.page_number + 1) if max_page else 1
            
            page = Page(
                note_id=note_id,
                page_number=next_page_number,
                content=data.get('content', ''),
                layout_settings=data.get('layout_settings', {})
            )
            
            db.add(page)
            db.commit()
            
            logger.info(f"ページを追加しました: ID={page.id}")
            return jsonify({
                'id': page.id,
                'note_id': page.note_id,
                'page_number': page.page_number,
                'content': page.content,
                'layout_settings': page.layout_settings
            }), 201
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"データベースエラー: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"予期せぬエラー: {str(e)}")
        if not isinstance(e, (NoteError, SQLAlchemyError)):
            return jsonify({'error': 'サーバーエラーが発生しました'}), 500
        raise

@notes_bp.route('/notes/<int:note_id>/pages/<int:page_id>', methods=['PUT'])
def update_page(note_id, page_id):
    """指定されたページの内容を更新するエンドポイント"""
    try:
        logger.info(f"ページ更新リクエスト: ノートID={note_id}, ページID={page_id}")
        data = request.get_json()
        
        if not data:
            logger.warning("データが必要です")
            raise NoteError('データが必要です')
            
        db = Session()
        try:
            page = db.query(Page).filter(
                Page.id == page_id,
                Page.note_id == note_id
            ).first()
            
            if not page:
                logger.warning(f"ページが見つかりません: ID={page_id}")
                raise NoteError('指定されたページが見つかりません', 404)
                
            if 'content' in data:
                page.content = data['content']
            if 'layout_settings' in data:
                page.layout_settings = data['layout_settings']
                
            db.commit()
            
            logger.info(f"ページを更新しました: ID={page_id}")
            return jsonify({
                'id': page.id,
                'note_id': page.note_id,
                'page_number': page.page_number,
                'content': page.content,
                'layout_settings': page.layout_settings
            })
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"データベースエラー: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"予期せぬエラー: {str(e)}")
        if not isinstance(e, (NoteError, SQLAlchemyError)):
            return jsonify({'error': 'サーバーエラーが発生しました'}), 500
        raise

@notes_bp.route('/notes/<int:note_id>/pages/<int:page_id>', methods=['DELETE'])
def delete_page(note_id, page_id):
    """指定されたページを削除するエンドポイント"""
    try:
        logger.info(f"ページ削除リクエスト: ノートID={note_id}, ページID={page_id}")
        db = Session()
        try:
            page = db.query(Page).filter(
                Page.id == page_id,
                Page.note_id == note_id
            ).first()
            
            if not page:
                logger.warning(f"ページが見つかりません: ID={page_id}")
                raise NoteError('指定されたページが見つかりません', 404)
                
            db.delete(page)
            db.commit()
            
            # ページ番号を再整理
            remaining_pages = db.query(Page).filter(
                Page.note_id == note_id,
                Page.page_number > page.page_number
            ).order_by(Page.page_number).all()
            
            for p in remaining_pages:
                p.page_number -= 1
                
            db.commit()
            
            logger.info(f"ページを削除しました: ID={page_id}")
            return jsonify({'message': 'ページを削除しました'})
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"データベースエラー: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"予期せぬエラー: {str(e)}")
        if not isinstance(e, (NoteError, SQLAlchemyError)):
            return jsonify({'error': 'サーバーエラーが発生しました'}), 500
        raise
