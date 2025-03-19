#!/bin/bash
# 認証機能およびデータアクセス制御のテストを実行するスクリプト

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘッダー表示
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     認証機能およびデータアクセス制御テスト実行     ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# 環境変数チェック
if [ -z "$TEST_FIREBASE_TOKEN" ]; then
    echo -e "${YELLOW}警告: TEST_FIREBASE_TOKEN が設定されていません${NC}"
    echo "テスト実行前に、有効なFirebaseトークンを環境変数に設定してください"
    echo "例: export TEST_FIREBASE_TOKEN=<your_token>"
    echo ""
    read -p "テストトークンなしで続行しますか？(y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "テストを中止します"
        exit 1
    fi
fi

# テスト環境の確認
echo -e "${YELLOW}注意: このテストは実際のデータベースに変更を加えます${NC}"
echo "テスト用のデータベースを使用することを強く推奨します"
echo ""
read -p "続行しますか？(y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "テストを中止します"
    exit 1
fi

# 認証ミドルウェアのテスト
echo -e "${GREEN}1. 認証ミドルウェアのテスト実行中...${NC}"
python test_auth.py

# 実行結果確認
if [ $? -ne 0 ]; then
    echo -e "${RED}認証ミドルウェアのテストが失敗しました${NC}"
else
    echo -e "${GREEN}認証ミドルウェアのテストが成功しました${NC}"
fi

echo ""

# データアクセス制御のテスト
echo -e "${GREEN}2. データアクセス制御のテスト実行中...${NC}"
python test_data_access.py

# 実行結果確認
if [ $? -ne 0 ]; then
    echo -e "${RED}データアクセス制御のテストが失敗しました${NC}"
else
    echo -e "${GREEN}データアクセス制御のテストが成功しました${NC}"
fi

echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}                テスト実行完了                       ${NC}"
echo -e "${BLUE}======================================================${NC}" 