#!/bin/bash
# フロントエンド認証テスト実行スクリプト

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘッダー表示
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     フロントエンド認証機能テスト実行     ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# 環境変数チェック
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}警告: .env ファイルが見つかりません${NC}"
    echo "テスト実行前に、Firebase設定を含む.envファイルを作成してください"
    echo ""
    read -p "環境変数なしで続行しますか？(y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "テストを中止します"
        exit 1
    fi
fi

# 必要なnpmパッケージの確認
echo -e "${GREEN}依存パッケージの確認中...${NC}"
if ! npm list | grep -q "firebase"; then
    echo -e "${YELLOW}警告: firebaseパッケージが見つかりません。インストールします...${NC}"
    npm install firebase
fi

if ! npm list | grep -q "axios"; then
    echo -e "${YELLOW}警告: axiosパッケージが見つかりません。インストールします...${NC}"
    npm install axios
fi

# Viteの開発サーバーを起動
echo -e "${GREEN}Vite開発サーバーを起動中...${NC}"
echo -e "${YELLOW}注意: テストを実行するにはサーバーが必要です${NC}"
echo ""

# テスト実行のための一時ファイルを作成
mkdir -p public
cat > public/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <title>認証テスト</title>
  <script type="module" src="/src/test/run_auth_tests.js"></script>
</head>
<body>
  <h1>認証テスト実行中...</h1>
  <p>コンソールを確認してください。テスト結果はそこに表示されます。</p>
</body>
</html>
EOL

# Viteを開発モードで実行
echo -e "${GREEN}テストを実行するために開発サーバーを起動します...${NC}"
echo -e "${YELLOW}ブラウザが開いたら、コンソール(F12)を確認してテスト結果を確認してください${NC}"
echo ""

npm run dev 