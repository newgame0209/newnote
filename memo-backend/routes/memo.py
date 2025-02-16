from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from models.memo import Memo
from database import db_session

memo_bp = Blueprint('memo', __name__)

@memo_bp.route('/memos', methods=['POST'])
def create_memo():
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
            'main_category': memo.main_category,
            'sub_category': memo.sub_category,
            'created_at': memo.created_at,
            'updated_at': memo.updated_at
        }), 201
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({'error': '保存に失敗しました'}), 500

@memo_bp.route('/memos/<int:memo_id>', methods=['PUT'])
def update_memo(memo_id):
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
            'main_category': memo.main_category,
            'sub_category': memo.sub_category,
            'updated_at': memo.updated_at
        })
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({'error': '更新に失敗しました'}), 500

@memo_bp.route('/memos/<int:memo_id>', methods=['GET'])
def get_memo(memo_id):
    try:
        memo = Memo.query.get(memo_id)
        if not memo:
            return jsonify({'error': 'メモが見つかりません'}), 404

        return jsonify({
            'id': memo.id,
            'title': memo.title,
            'content': memo.content,
            'main_category': memo.main_category,
            'sub_category': memo.sub_category,
            'created_at': memo.created_at,
            'updated_at': memo.updated_at
        })
    except SQLAlchemyError as e:
        return jsonify({'error': '取得に失敗しました'}), 500

@memo_bp.route('/memos', methods=['GET'])
def get_memos():
    try:
        memos = Memo.query.all()
        return jsonify([{
            'id': memo.id,
            'title': memo.title,
            'content': memo.content,
            'main_category': memo.main_category,
            'sub_category': memo.sub_category,
            'created_at': memo.created_at,
            'updated_at': memo.updated_at
        } for memo in memos])
    except SQLAlchemyError as e:
        return jsonify({'error': '取得に失敗しました'}), 500
