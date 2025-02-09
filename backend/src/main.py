"""
@docs
メインアプリケーションファイル
FastAPIアプリケーションの設定とルーティングの初期化を行います。
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="しゃべるノート API",
    description="ノートを音声に変換するためのRESTful API",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのオリジン
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """
    @docs
    ルートエンドポイント
    APIが正常に動作していることを確認するためのヘルスチェックエンドポイント

    Returns:
        dict: APIの状態を示すメッセージ
    """
    return {"message": "しゃべるノート API", "status": "running"}
