from flask import jsonify, request, g
from . import notes_bp
from database import Session
from models import Note, Page
from datetime import datetime
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import SQLAlchemyError
from logger import logger
from middleware import auth_required

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
@auth_required
def create_note():
    """ノートを新規作成するエンドポイント"""
    try:
        logger.info("ノート作成リクエストを受信")
        data = request.get_json()
        
        # 必須フィールドのバリデーション
        if not data or 'title' not in data:
            logger.warning("タイトルが指定されていません")
            raise NoteError('タイトルは必須です')
        
        db = Session()
        try:
            note = Note(
                title=data['title'],
                main_category=data.get('main_category', 'その他'),
                sub_category=data.get('sub_category', ''),
                user_id=g.user_id  # ユーザーIDを設定
            )
            db.add(note)
            db.commit()
            
            logger.info(f"ノートを作成しました: ID={note.id}")
            return jsonify({
                'id': note.id,
                'title': note.title,
                'main_category': note.main_category,
                'sub_category': note.sub_category,
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

@notes_bp.route('/notes', methods=['GET'])
@auth_required
def get_notes():
    """ノート一覧を取得するエンドポイント"""
    try:
        with Session() as session:
            notes = session.query(Note).filter(Note.user_id == g.user_id).order_by(Note.created_at.desc()).all()
            return jsonify([{
                'id': note.id,
                'title': note.title,
                'main_category': note.main_category,
                'sub_category': note.sub_category,
                'created_at': note.created_at.isoformat(),
                'updated_at': note.updated_at.isoformat()
            } for note in notes])
    except SQLAlchemyError as e:
        logger.error(f"Failed to fetch notes: {e}")
        raise

@notes_bp.route('/notes/<int:note_id>', methods=['GET'])
@auth_required
def get_note(note_id):
    """指定されたIDのノートを取得するエンドポイント"""
    logger.info(f"ノート取得リクエスト: ID={note_id}")
    db = Session()
    try:
        note = db.query(Note).options(joinedload(Note.pages)).filter(Note.id == note_id, Note.user_id == g.user_id).first()
        
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
@auth_required
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
            note = db.query(Note).filter(Note.id == note_id, Note.user_id == g.user_id).first()
            
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
@auth_required
def delete_note(note_id):
    """指定されたIDのノートを削除するエンドポイント"""
    try:
        logger.info(f"ノート削除リクエスト: ID={note_id}")
        db = Session()
        try:
            note = db.query(Note).filter(Note.id == note_id, Note.user_id == g.user_id).first()
            
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
@auth_required
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
            note = db.query(Note).filter(Note.id == note_id, Note.user_id == g.user_id).first()
            
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
@auth_required
def update_page(note_id, page_id):
    """指定されたページの内容を更新するエンドポイント。ページが存在しない場合は新規作成する。"""
    try:
        logger.info(f"ページ更新リクエスト: ノートID={note_id}, ページID={page_id}")
        data = request.get_json()
        
        if not data:
            logger.warning("データが必要です")
            raise NoteError('データが必要です')
            
        db = Session()
        try:
            # まずノートの存在確認
            note = db.query(Note).filter(Note.id == note_id, Note.user_id == g.user_id).first()
            if not note:
                logger.warning(f"ノートが見つかりません: ID={note_id}")
                raise NoteError('指定されたノートが見つかりません', 404)

            # ページの取得または新規作成
            page = db.query(Page).filter(
                Page.note_id == note_id,
                Page.page_number == page_id  # page_idをpage_numberとして使用
            ).first()
            
            if not page:
                # ページが存在しない場合は新規作成
                page = Page(
                    note_id=note_id,
                    page_number=page_id,
                    content=data.get('content', ''),
                    layout_settings=data.get('layout_settings', {})
                )
                db.add(page)
                logger.info(f"新しいページを作成: ノートID={note_id}, ページ番号={page_id}")
            else:
                # 既存のページを更新
                if 'content' in data:
                    page.content = data['content']
                if 'layout_settings' in data:
                    page.layout_settings = data['layout_settings']
                logger.info(f"既存のページを更新: ID={page.id}")
                
            db.commit()
            
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

@notes_bp.route('/notes/<int:note_id>/pages/<int:page_id>', methods=['GET'])
@auth_required
def get_page(note_id, page_id):
    """指定されたページを取得するエンドポイント"""
    try:
        logger.info(f"ページ取得リクエスト: ノートID={note_id}, ページID={page_id}")
        
        db = Session()
        try:
            # まずノートの存在確認
            note = db.query(Note).filter(Note.id == note_id, Note.user_id == g.user_id).first()
            if not note:
                logger.warning(f"ノートが見つかりません: ID={note_id}")
                raise NoteError('指定されたノートが見つかりません', 404)

            # ページの取得
            page = db.query(Page).filter(
                Page.note_id == note_id,
                Page.page_number == page_id
            ).first()
            
            if not page:
                logger.warning(f"ページが見つかりません: ノートID={note_id}, ページ番号={page_id}")
                # ページが存在しない場合は空のページを返す
                return jsonify({
                    'id': None,
                    'note_id': note_id,
                    'page_number': page_id,
                    'content': '',
                    'layout_settings': {}
                }), 200
            
            logger.info(f"ページを取得しました: ID={page.id}")
            return jsonify({
                'id': page.id,
                'note_id': page.note_id,
                'page_number': page.page_number,
                'content': page.content,
                'layout_settings': page.layout_settings
            }), 200
            
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
@auth_required
def delete_page(note_id, page_id):
    """指定されたページを削除するエンドポイント"""
    try:
        logger.info(f"ページ削除リクエスト: ノートID={note_id}, ページID={page_id}")
        db = Session()
        try:
            page = db.query(Page).filter(
                Page.note_id == note_id,
                Page.page_number == page_id
            ).first()
            
            if not page:
                logger.warning(f"ページが見つかりません: ID={page_id}")
                raise NoteError('指定されたページが見つかりません', 404)
                
            db.delete(page)
            db.commit()
            
            # ページ番号を再整理
            remaining_pages = db.query(Page).filter(
                Page.note_id == note_id,
                Page.page_number > page_id
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
