# 「しゃべるノート」Ver2 プロジェクトステータス

## 実装計画概要

「しゃべるノート」Ver2では、以下の機能を優先度順に実装していきます。

## 実装状況

### 1. ノート一覧の未実装
- [x] **音声スピード調整機能**
  - [x] SettingsContextの拡張（speakingRate状態の追加）
  - [x] 設定ダイアログUIの更新（早い・ノーマル・ゆっくり）
  - [x] TTS API通信の拡張

### 2. キャンバス機能の未実装
- [x] **しおり機能**
  - [x] データモデルの拡張
  - [x] バックエンドAPIの実装
  - [x] フロントエンドUIの実装

- [ ] **操作取り消し機能**
  - [ ] キャンバス履歴管理の実装
  - [ ] 「一つ前に戻す」ボタンの追加

- [ ] **iPad対応（Apple Pencilのみ反応）**
  - [ ] Apple Pencil検出ロジックの実装
  - [ ] タッチイベント処理の修正

### 3. メモ機能の未実装
- [x] **テキスト選択時の音声変換**
  - [x] 選択テキスト取得機能の実装
  - [x] 選択テキストのみを変換するロジック追加
  - [x] UI更新

- [ ] **メモページの追加機能**
  - [ ] データモデルの拡張
  - [ ] バックエンドAPI実装
  - [ ] フロントエンドUIの実装

### 4. 完全なる新機能
- [ ] **新規登録・認証機能**
  - [ ] データベーススキーマの拡張
  - [ ] 認証エンドポイントの実装
  - [ ] フロントエンドの登録・ログインUI実装
  - [ ] 既存データの移行対応

## 現在の作業項目
- 実装計画の策定と優先順位付け [完了]
- 開発環境のセットアップ確認 [完了]
- 音声スピード調整機能の実装 [完了]
- メモテキスト選択時の音声変換機能の実装 [完了]
- しおり機能の実装 [完了]

## 次のステップ
- 操作取り消し機能の実装
- iPad対応（Apple Pencilのみ反応）の実装
- メモページの追加機能の実装

## プロジェクトの詳細な実装状況（2025-02-16現在）

### A. ノート機能
#### 描画機能 [OK]
- **実装済み**
  - Fabric.jsによるキャンバス描画
  - ペンツール（色、太さの調整）
  - 消しゴムツール
  - マーカーツール
  - ページ切り替え（最大10ページ）
  - 自動保存機能
  - キャンバスのクリア機能
  - アンドゥ/リドゥ機能

- **既知の問題**
  - 高解像度デバイスでの描画パフォーマンス
  - 一部デバイスでのタッチ入力の遅延

#### OCR機能 [OK]
- **実装済み**
  - Google Cloud Vision APIによる手書き文字認識
  - 画像の前処理（圧縮、最適化）
  - 日本語文字認識対応
  - エラーハンドリング

- **既知の問題**
  - 認識精度の向上が必要
  - 処理時間の最適化

#### 音声変換機能 [OK]
- **実装済み**
  - Google Cloud Text-to-Speech API連携
  - 男性/女性の声の切り替え
  - 音声設定の保存
  - 音声再生コントロール
  - 音声スピード調整機能（早い・ノーマル・ゆっくり）
  - テキスト選択時の音声変換

- **既知の問題**
  - 長文での変換時間
  - 一部ブラウザでの音声再生の遅延

### B. メモ機能
#### 基本機能 [OK]
- **実装済み**
  - メモの作成/編集/削除
  - カテゴリ分類
  - タイトル検索
  - 自動保存

#### UI/UX [WARN]
- **実装済み**
  - レスポンシブデザイン
  - ダークモード対応
  - キーボードショートカット

### C. 共通機能
#### データ同期 [WARN]
- **実装済み**
  - ローカルストレージによる一時保存
  - 定期的なバックアップ

- **未実装**
  - クラウド同期
  - オフライン対応
  - 同期競合の解決

#### セキュリティ [WIP]
- **実装済み**
  - APIキーの環境変数管理
  - 入力値のバリデーション
  - XSS対策

- **実装中**
  - ユーザー認証
  - データの暗号化
  - アクセス制御

## 技術スタックと依存関係

### フロントエンド
- **フレームワーク**
  - React 18.x [OK]
  - TypeScript 4.x [OK]
  - Vite 4.x [OK]

- **UI/描画**
  - Fabric.js 5.x [OK]
  - TailwindCSS 3.x [OK]
  - Lucide React（アイコン） [OK]

- **状態管理**
  - React Context [OK]
  - Zustand [OK]

### バックエンド
- **フレームワーク**
  - Flask 2.x [OK]
  - SQLAlchemy 1.4.x [OK]

- **データベース**
  - SQLite 3.x [OK]

- **API連携**
  - Google Cloud Vision API [OK]
  - Google Cloud Text-to-Speech API [OK]

## 環境設定

### 必要な環境変数
```
# アプリケーション設定
APP_ENV=development
APP_DEBUG=true

# データベース設定
DATABASE_URL=sqlite:///./notes.db

# Google Cloud設定
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
GOOGLE_CLOUD_PROJECT=project-id
```

### ポート設定
- フロントエンド: 3000
- ノートバックエンド: 5001
- メモバックエンド: 5002

## 残りのタスク（優先度順）

### 優先度高
1. メモ機能の完成
   - [ ] メモのリアルタイムプレビュー
   - [ ] タグ機能の実装
   - [ ] 検索機能の強化

2. パフォーマンス最適化
   - [ ] 描画パフォーマンスの改善
   - [ ] OCR処理の最適化
   - [ ] 音声変換の高速化

### 優先度中
1. UI/UX改善
   - [ ] ドラッグ&ドロップ実装
   - [ ] メモのインポート/エクスポート
   - [ ] キーボードショートカットの拡充

2. セキュリティ強化
   - [ ] ユーザー認証の実装
   - [ ] データの暗号化
   - [ ] アクセス制御の実装

### 優先度低
1. 追加機能
   - [ ] クラウド同期
   - [ ] オフライン対応
   - [ ] 共有機能

## 既知の問題と対応状況

### クリティカルな問題
1. 描画パフォーマンス
   - 症状: 高解像度デバイスでの描画遅延
   - 原因: キャンバスサイズの最適化不足
   - 対応: 実装中 [WIP]

2. メモリリーク
   - 症状: 長時間使用時のメモリ使用量増加
   - 原因: キャンバスデータの解放漏れ
   - 対応: 調査中 [WARN]

### 一般的な問題
1. UI/UX
   - タブ切り替え時のちらつき
   - モバイル表示の最適化
   - ダークモードの不具合

2. 機能面
   - OCR認識精度の向上
   - 音声変換の品質改善
   - オフライン時の動作安定性

## 開発環境のセットアップ

### バックエンド
```bash
# 1. 仮想環境の作成と有効化
python3 -m venv venv
source venv/bin/activate

# 2. 依存関係のインストール
pip install -r requirements.txt

# 3. 環境変数の設定
cp .env.example .env
# .envファイルを編集

# 4. データベースの初期化
python init_db.py

# 5. サーバーの起動
python app.py
```

### フロントエンド
```bash
# 1. 依存関係のインストール
npm install

# 2. 開発サーバーの起動
npm run dev
```

## テスト状況

### 単体テスト
- バックエンドAPI: 80% カバレッジ [OK]
- フロントエンドコンポーネント: 60% カバレッジ [WIP]
- ユーティリティ関数: 90% カバレッジ [OK]

### 統合テスト
- API統合テスト: 70% 完了 [WIP]
- E2Eテスト: 40% 完了 [WARN]

### パフォーマンステスト
- 負荷テスト: 未実施 [TODO]
- メモリリークテスト: 実施中 [WIP]

## デプロイメント

### 現在の環境
- 開発環境: ローカル環境
- テスト環境: 未設定
- 本番環境: 未設定

### 必要なステップ
1. CI/CDパイプラインの構築
2. テスト環境の整備
3. 本番環境の準備
4. モニタリングの設定

## ドキュメント状況

### 作成済み
- API仕様書 [OK]
- データベース設計書 [OK]
- 基本機能説明書 [OK]

### 作成中
- 詳細設計書 [WIP]
- 運用マニュアル [WIP]
- トラブルシューティングガイド [WIP]

### 未作成
- デプロイメントガイド [TODO]
- パフォーマンスチューニングガイド [TODO]

## 凡例
- [OK] 完了・正常動作
- [WIP] 実装中・調整中
- [WARN] 問題あり・要対応
- [TODO] 未実装・未対応