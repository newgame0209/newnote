from PIL import Image, ImageDraw, ImageFont
import base64
import io

# 画像サイズとフォントサイズを大きくする
width = 800
height = 400
background_color = (255, 255, 255)  # 白色の背景
text_color = (0, 0, 0)  # 黒色のテキスト

# 新しい画像を作成
image = Image.new('RGB', (width, height), background_color)
draw = ImageDraw.Draw(image)

# macOSの日本語フォントを使用
try:
    # ヒラギノ角ゴシックを試す
    font = ImageFont.truetype('/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc', 60)
except:
    try:
        # 代替フォントとしてOsaka-Monoを試す
        font = ImageFont.truetype('/System/Library/Fonts/Osaka.ttf', 60)
    except:
        print("警告: 日本語フォントが見つかりません。デフォルトフォントを使用します。")
        font = ImageFont.load_default()

# テストテキストを描画（中央に配置）
test_text = "こんにちは\nテストです"
text_bbox = draw.textbbox((0, 0), test_text, font=font, spacing=40)
text_width = text_bbox[2] - text_bbox[0]
text_height = text_bbox[3] - text_bbox[1]
x = (width - text_width) // 2
y = (height - text_height) // 2

# テキストを描画
draw.text((x, y), test_text, font=font, fill=text_color, spacing=40, stroke_width=5)

# 画像をJPEGとして保存（高品質）
buffer = io.BytesIO()
image.save(buffer, format='JPEG', quality=95)
img_str = base64.b64encode(buffer.getvalue()).decode()

# Base64データをファイルに保存
with open('test_image_base64.txt', 'w') as f:
    f.write(img_str)

# デバッグ用に実際の画像も保存
image.save('test_image.jpg', quality=95)

print("テスト画像を生成しました（test_image.jpgも保存）")
