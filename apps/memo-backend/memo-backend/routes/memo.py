from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from models.memo import Memo
from database import db_session
import traceback

memo_bp = Blueprint('memo', __name__)

@memo_bp.route('/memos', methods=['POST', 'OPTIONS'])
def create_memo():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.get_json()
        memo = Memo(
            title=data.get('title', '無題'),
            content=data.get('content', ''),
            main_category=data.get('main_category'),
            sub_category=data.get('sub_category')
        )
        db_session.add(memo)
        db_session.commit()
        
        return jsonify({
            'id': memo.id,
            'title': memo.title,
            'content': memo.content,
            'mainCategory': memo.main_category,
            'subCategory': memo.sub_category,
            'createdAt': memo.created_at,
            'updatedAt': memo.updated_at
        }), 201
    except Exception as e:
        db_session.rollback()
        print(f"Error creating memo: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '保存に失敗しました'}), 500

@memo_bp.route('/memos/list', methods=['GET', 'OPTIONS'])
def get_memos():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        memos = Memo.query.all()
        return jsonify([{
            'id': memo.id,
            'title': memo.title,
            'content': memo.content,
            'mainCategory': memo.main_category,
            'subCategory': memo.sub_category,
            'createdAt': memo.created_at,
            'updatedAt': memo.updated_at
        } for memo in memos])
    except Exception as e:
        print(f"Error getting memos: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '取得に失敗しました'}), 500

@memo_bp.route('/memos/<int:memo_id>', methods=['GET', 'OPTIONS'])
def get_memo(memo_id):
    if request.method == 'OPTIONS':
        return '', 204
    try:
        memo = Memo.query.get(memo_id)
        if not memo:
            return jsonify({'error': 'メモが見つかりません'}), 404

        return jsonify({
            'id': memo.id,
            'title': memo.title,
            'content': memo.content,
            'mainCategory': memo.main_category,
            'subCategory': memo.sub_category,
            'createdAt': memo.created_at,
            'updatedAt': memo.updated_at
        })
    except Exception as e:
        print(f"Error getting memo {memo_id}: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '取得に失敗しました'}), 500

@memo_bp.route('/memos/<int:memo_id>', methods=['PUT', 'OPTIONS'])
def update_memo(memo_id):
    if request.method == 'OPTIONS':
        return '', 204
    try:
        memo = Memo.query.get(memo_id)
        if not memo:
            return jsonify({'error': 'メモが見つかりません'}), 404

        data = request.get_json()
        if 'title' in data:
            memo.title = data['title']
        if 'content' in data:
            memo.content = data['content']
        if 'main_category' in data:
            memo.main_category = data['main_category']
        if 'sub_category' in data:
            memo.sub_category = data['sub_category']

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
    except Exception as e:
        db_session.rollback()
        print(f"Error updating memo {memo_id}: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '更新に失敗しました'}), 500

@memo_bp.route('/memos/<int:memo_id>', methods=['DELETE', 'OPTIONS'])
def delete_memo(memo_id):
    if request.method == 'OPTIONS':
        return '', 204
    try:
        memo = Memo.query.get(memo_id)
        if not memo:
            return jsonify({'error': 'メモが見つかりません'}), 404

        db_session.delete(memo)
        db_session.commit()
        return '', 204
    except Exception as e:
        db_session.rollback()
        print(f"Error deleting memo {memo_id}: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '削除に失敗しました'}), 500
