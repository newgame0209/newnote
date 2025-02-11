from flask import jsonify, request
from google.cloud import vision
import io
import base64
from . import notes_bp
import json

def init_vision_client():
    """Vision APIクライアントの初期化"""
    try:
        return vision.ImageAnnotatorClient()
    except Exception as e:
        raise Exception(f"Vision APIクライアントの初期化に失敗しました: {str(e)}")

@notes_bp.route('/ocr', methods=['POST'])
def perform_ocr():
    """
    画像からテキストを抽出するエンドポイント
    
    Expected JSON:
    {
        "image": "base64_encoded_image_data"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': '画像データが必要です'}), 400
            
        # Base64デコード
        try:
            image_data = base64.b64decode(data['image'])
            print(f"画像データのサイズ: {len(image_data)} bytes")  # デバッグ用
        except Exception as e:
            print(f"Base64デコードエラー: {str(e)}")  # デバッグ用
            return jsonify({'error': '無効な画像データです'}), 400
            
        # Vision APIクライアントの初期化
        try:
            client = init_vision_client()
            print("Vision APIクライアントの初期化成功")  # デバッグ用
        except Exception as e:
            print(f"Vision APIクライアントの初期化エラー: {str(e)}")  # デバッグ用
            return jsonify({'error': f'Vision APIクライアントの初期化に失敗しました: {str(e)}'}), 500
        
        # 画像の準備
        image = vision.Image(content=image_data)
        
        # テキスト検出の実行
        try:
            print("テキスト検出を開始します...")  # デバッグ用
            response = client.text_detection(
                image=image,
                image_context={"language_hints": ["ja"]}  # 日本語優先
            )
            print("テキスト検出の実行成功")  # デバッグ用
            
            if response.error.message:
                print(f"Vision APIエラー: {response.error.message}")  # デバッグ用
                return jsonify({
                    'error': f'テキスト検出に失敗しました: {response.error.message}'
                }), 500
            
            # 検出されたテキストの取得
            if response.text_annotations:
                detected_text = response.text_annotations[0]
                print(f"検出されたテキスト: {detected_text.description}")  # デバッグ用
                print(f"信頼度: {detected_text.confidence}")  # デバッグ用
                print(f"境界ボックス: {detected_text.bounding_poly}")  # デバッグ用
                
                return jsonify({
                    'text': detected_text.description,
                    'confidence': detected_text.confidence if detected_text.confidence else 1.0,
                    'bounds': [
                        {'x': vertex.x, 'y': vertex.y}
                        for vertex in detected_text.bounding_poly.vertices
                    ] if detected_text.bounding_poly else None
                })
            else:
                print("テキストが検出されませんでした")  # デバッグ用
                # レスポンスの詳細な内容を表示
                print("レスポンスの詳細:")
                print(f"- full_text_annotation: {response.full_text_annotation}")
                print(f"- text_annotations: {response.text_annotations}")
                print(f"- error: {response.error}")
                return jsonify({'text': '', 'confidence': 0.0})
            
        except Exception as e:
            print(f"テキスト検出エラー: {str(e)}")  # デバッグ用
            return jsonify({'error': f'テキスト検出に失敗しました: {str(e)}'}), 500
        
    except Exception as e:
        print(f"予期せぬエラー: {str(e)}")  # デバッグ用
        return jsonify({
            'error': f'OCR処理中にエラーが発生しました: {str(e)}'
        }), 500
