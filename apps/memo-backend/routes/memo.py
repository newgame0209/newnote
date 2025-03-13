from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from models.memo import Memo
from models.memopage import MemoPage
from database import db_session
import traceback
from flask_jwt_extended import jwt_required, get_jwt_identity

memo_bp = Blueprint('memo', __name__)

@memo_bp.route('/memos', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required()
def create_memo():
    if request.method == 'OPTIONS':
        return '', 204
    
    if request.method == 'GET':
        try:
            # 現在の認証済みユーザーのIDを取得
            current_user_id = get_jwt_identity()
            
            # 自分のメモのみを取得
            memos = Memo.query.filter(Memo.user_id == current_user_id).order_by(Memo.created_at.desc()).all()
            return jsonify([{
                'id': memo.id,
                'title': memo.title,
                'content': memo.content,
                'mainCategory': memo.main_category,
                'subCategory': memo.sub_category,
                'createdAt': memo.created_at,
                'updatedAt': memo.updated_at
            } for memo in memos])
        except SQLAlchemyError as e:
            db_session.rollback()
            return jsonify({'error': 'データベースエラー'}), 500
    
    try:
        # 現在の認証済みユーザーのIDを取得
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        memo = Memo(
            title=data.get('title', '無題'),
            content=data.get('content', ''),
            main_category=data.get('main_category'),
            sub_category=data.get('sub_category'),
            user_id=current_user_id  # ユーザーIDを設定
        )
        db_session.add(memo)
        db_session.commit()
        
        # メモ作成時に自動的に最初のページ（ページ番号1）を作成
        try:
            first_page = MemoPage(
                memo_id=memo.id,
                page_number=1,  # バックエンドでは1ベース
                content=data.get('content', '')
            )
            db_session.add(first_page)
            db_session.commit()
            print(f"Initial page created for memo {memo.id}: page_number=1")
            
            # ページ情報を含めてレスポンスを返す
            return jsonify({
                'id': memo.id,
                'title': memo.title,
                'content': memo.content,
                'mainCategory': memo.main_category,
                'subCategory': memo.sub_category,
                'createdAt': memo.created_at,
                'updatedAt': memo.updated_at,
                'pages': [{
                    'id': first_page.id,
                    'memoId': first_page.memo_id,
                    'pageNumber': first_page.page_number,
                    'content': first_page.content,
                    'createdAt': first_page.created_at,
                    'updatedAt': first_page.updated_at
                }]
            }), 201
        except SQLAlchemyError as e:
            # 最初のページ作成に失敗してもメモ自体は作成されているので、エラーログだけ出力する
            print(f"Warning: Failed to create initial page for memo {memo.id}: {str(e)}")
            print(traceback.format_exc())
            
            # メモ情報のみ返す
            return jsonify({
                'id': memo.id,
                'title': memo.title,
                'content': memo.content,
                'mainCategory': memo.main_category,
                'subCategory': memo.sub_category,
                'createdAt': memo.created_at,
                'updatedAt': memo.updated_at,
                'pages': []
            }), 201
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({'error': 'データベースエラー'}), 500

@memo_bp.route('/memos/<int:memo_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
@jwt_required()
def get_memo(memo_id):
    if request.method == 'OPTIONS':
        return '', 204
    
    # 現在の認証済みユーザーのIDを取得
    current_user_id = get_jwt_identity()
    
    if request.method == 'GET':
        try:
            memo = Memo.query.get(memo_id)
            if not memo:
                return jsonify({'error': '指定されたメモが見つかりません'}), 404
            
            # 権限チェック: 自分のメモでなければアクセス不可
            if memo.user_id != current_user_id:
                return jsonify({'error': 'このメモへのアクセス権限がありません'}), 403
            
            return jsonify({
                'id': memo.id,
                'title': memo.title,
                'content': memo.content,
                'mainCategory': memo.main_category,
                'subCategory': memo.sub_category,
                'createdAt': memo.created_at,
                'updatedAt': memo.updated_at
            })
        except SQLAlchemyError:
            db_session.rollback()
            return jsonify({'error': 'データベースエラー'}), 500
    
    if request.method == 'PUT':
        try:
            memo = Memo.query.get(memo_id)
            if not memo:
                return jsonify({'error': '指定されたメモが見つかりません'}), 404
            
            # 権限チェック: 自分のメモでなければ更新不可
            if memo.user_id != current_user_id:
                return jsonify({'error': 'このメモの更新権限がありません'}), 403
            
            data = request.get_json()
            memo.title = data.get('title', memo.title)
            memo.content = data.get('content', memo.content)
            memo.main_category = data.get('mainCategory', memo.main_category)
            memo.sub_category = data.get('subCategory', memo.sub_category)
            db_session.commit()
            
            return jsonify({
                'id': memo.id,
                'title': memo.title,
                'content': memo.content,
                'mainCategory': memo.main_category,
                'subCategory': memo.sub_category,
                'createdAt': memo.created_at,
                'updatedAt': memo.updated_at
            })
        except SQLAlchemyError:
            db_session.rollback()
            return jsonify({'error': 'データベースエラー'}), 500
    
    if request.method == 'DELETE':
        try:
            memo = Memo.query.get(memo_id)
            if not memo:
                return jsonify({'error': '指定されたメモが見つかりません'}), 404
            
            # 権限チェック: 自分のメモでなければ削除不可
            if memo.user_id != current_user_id:
                return jsonify({'error': 'このメモの削除権限がありません'}), 403
            
            db_session.delete(memo)
            db_session.commit()
            return jsonify({'message': 'メモを削除しました'})
        except SQLAlchemyError:
            db_session.rollback()
            return jsonify({'error': 'データベースエラー'}), 500

@memo_bp.route('/memos/<int:memo_id>/pages', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required()
def memo_pages(memo_id):
    """
    @docs
    メモのページを取得または新規作成するAPI
    
    Args:
        memo_id: メモID
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    # 現在の認証済みユーザーのIDを取得
    current_user_id = get_jwt_identity()
    
    # メモの所有者確認
    memo = Memo.query.get(memo_id)
    if not memo:
        return jsonify({'error': '指定されたメモが見つかりません'}), 404
    
    # 権限チェック: 自分のメモでなければアクセス不可
    if memo.user_id != current_user_id:
        return jsonify({'error': 'このメモへのアクセス権限がありません'}), 403
    
    # GET: メモのすべてのページを取得
    if request.method == 'GET':
        try:
            pages = MemoPage.query.filter_by(memo_id=memo_id).order_by(MemoPage.page_number).all()
            return jsonify([{
                'id': page.id,
                'memoId': page.memo_id,
                'pageNumber': page.page_number,
                'content': page.content,
                'createdAt': page.created_at,
                'updatedAt': page.updated_at
            } for page in pages])
        except SQLAlchemyError as e:
            db_session.rollback()
            return jsonify({'error': 'データベースエラー'}), 500
    
    # POST: 新しいページを追加
    try:
        data = request.get_json()
        
        # 既存のページ数をカウント
        page_count = MemoPage.query.filter_by(memo_id=memo_id).count()
        
        # 10ページ以上は作成できない
        if page_count >= 10:
            return jsonify({'error': 'ページ数の上限に達しました'}), 400
        
        # 次のページ番号を取得（フロントエンドとの整合性を考慮）
        # フロントエンドからのページ番号は0ベース、バックエンドでは1ベースで扱う
        next_page_number = page_count + 1
        print(f"Creating new page with number: {next_page_number} for memo {memo_id}")
        
        memo_page = MemoPage(
            memo_id=memo_id,
            page_number=next_page_number,
            content=data.get('content', '')
        )
        
        db_session.add(memo_page)
        db_session.commit()
        
        return jsonify({
            'id': memo_page.id,
            'memoId': memo_page.memo_id,
            'pageNumber': memo_page.page_number,
            'content': memo_page.content,
            'createdAt': memo_page.created_at,
            'updatedAt': memo_page.updated_at
        }), 201
    except SQLAlchemyError as e:
        db_session.rollback()
        traceback.print_exc()
        return jsonify({'error': 'ページの作成に失敗しました'}), 500

@memo_bp.route('/memos/<int:memo_id>/pages/<int:page_number>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def memo_page(memo_id, page_number):
    """
    @docs
    特定のメモページを操作するAPI
    
    Args:
        memo_id: メモID
        page_number: ページ番号
    """
    try:
        print(f"Received request for memo {memo_id}, page {page_number}")
        
        # まずメモの存在確認
        memo = Memo.query.get(memo_id)
        if not memo:
            print(f"Memo {memo_id} not found")
            return jsonify({'error': '指定されたメモが存在しません'}), 404
        
        # 権限チェック: 自分のメモでなければアクセス不可
        current_user_id = get_jwt_identity()
        if memo.user_id != current_user_id:
            return jsonify({'error': 'このメモへのアクセス権限がありません'}), 403
        
        # このメモの全ページを取得して詳細なデバッグ情報を出力
        all_pages = MemoPage.query.filter_by(memo_id=memo_id).all()
        page_numbers = [p.page_number for p in all_pages]
        print(f"All pages for memo {memo_id}: {page_numbers}")
        
        # ページ番号でページを取得
        memo_page = MemoPage.query.filter_by(page_number=page_number, memo_id=memo_id).first()
        print(f"Page query result for page {page_number}: {memo_page}")
        
        # ページが見つからない場合は、ID検索も試みる（移行期の互換性のため）
        if not memo_page and page_number > 0:
            print(f"Trying fallback: looking for page by ID {page_number}")
            memo_page = MemoPage.query.filter_by(id=page_number, memo_id=memo_id).first()
            print(f"Fallback query result: {memo_page}")
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'ページの検索中にエラーが発生しました'}), 500
    if not memo_page:
        return jsonify({'error': '指定されたページが存在しません'}), 404
    
    # GET: 特定のページを取得
    if request.method == 'GET':
        return jsonify({
            'id': memo_page.id,
            'memoId': memo_page.memo_id,
            'pageNumber': memo_page.page_number,
            'content': memo_page.content,
            'createdAt': memo_page.created_at,
            'updatedAt': memo_page.updated_at
        })
    
    # PUT: ページを更新
    if request.method == 'PUT':
        try:
            data = request.get_json()
            
            memo_page.content = data.get('content', memo_page.content)
            db_session.commit()
            
            return jsonify({
                'id': memo_page.id,
                'memoId': memo_page.memo_id,
                'pageNumber': memo_page.page_number,
                'content': memo_page.content,
                'createdAt': memo_page.created_at,
                'updatedAt': memo_page.updated_at
            })
        except SQLAlchemyError as e:
            db_session.rollback()
            return jsonify({'error': 'ページの更新に失敗しました'}), 500
    
    # DELETE: ページを削除
    if request.method == 'DELETE':
        try:
            # このページより後のページの番号を一つづつ減らす
            later_pages = MemoPage.query.filter(
                MemoPage.memo_id == memo_id,
                MemoPage.page_number > memo_page.page_number
            ).order_by(MemoPage.page_number).all()
            
            for later_page in later_pages:
                later_page.page_number -= 1
            
            # 指定されたページを削除
            db_session.delete(memo_page)
            db_session.commit()
            
            return jsonify({'message': 'ページが削除されました'})
        except SQLAlchemyError as e:
            db_session.rollback()
            return jsonify({'error': 'ページの削除に失敗しました'}), 500
