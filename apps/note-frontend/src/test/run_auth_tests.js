// 認証フローのテストを実行するスクリプト
import { register, login, getToken, verifyToken, accessProtectedEndpoint } from './auth.test.js';

// テスト設定
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test@123456';
const TEST_USERNAME = 'テストユーザー';

// 色付きログ出力
const log = {
  info: (msg) => console.log('\x1b[34m%s\x1b[0m', msg),
  success: (msg) => console.log('\x1b[32m%s\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m%s\x1b[0m', msg),
  warning: (msg) => console.log('\x1b[33m%s\x1b[0m', msg)
};

// テスト実行
async function runTests() {
  log.info('===== 認証フローテスト開始 =====');
  
  try {
    // ステップ1: ユーザー登録テスト
    log.info('\n1. ユーザー登録テスト実行中...');
    const registerResult = await register(TEST_EMAIL, TEST_PASSWORD, TEST_USERNAME);
    if (registerResult.success) {
      log.success('ユーザー登録テスト: 成功');
    } else {
      if (registerResult.error && registerResult.error.code === 'auth/email-already-in-use') {
        log.warning('ユーザー登録テスト: ユーザーは既に存在します（テスト続行）');
      } else {
        log.error(`ユーザー登録テスト: 失敗 - ${registerResult.error?.message || '不明なエラー'}`);
        // 登録に失敗しても、既存アカウントでログインを試みるためテストを続行
      }
    }
    
    // ステップ2: ログインテスト
    log.info('\n2. ログインテスト実行中...');
    const loginResult = await login(TEST_EMAIL, TEST_PASSWORD);
    if (loginResult.success) {
      log.success('ログインテスト: 成功');
    } else {
      log.error(`ログインテスト: 失敗 - ${loginResult.error?.message || '不明なエラー'}`);
      throw new Error('ログインテストに失敗したため、テストを中断します');
    }
    
    // ステップ3: トークン取得テスト
    log.info('\n3. トークン取得テスト実行中...');
    const tokenResult = await getToken();
    if (tokenResult.success) {
      log.success('トークン取得テスト: 成功');
      log.info(`トークン: ${tokenResult.token}`);
      // トークンを出力して、バックエンドテストで使用できるようにする
      console.log("\n=== TEST_FIREBASE_TOKEN ===");
      console.log(tokenResult.token);
      console.log("======================");
    } else {
      log.error(`トークン取得テスト: 失敗 - ${tokenResult.error?.message || '不明なエラー'}`);
      throw new Error('トークン取得テストに失敗したため、テストを中断します');
    }
    
    // ステップ4: トークン検証テスト
    log.info('\n4. トークン検証テスト実行中...');
    const verifyResult = await verifyToken(tokenResult.token);
    if (verifyResult.success) {
      log.success('トークン検証テスト: 成功');
      log.info(`検証されたユーザー情報: ${JSON.stringify(verifyResult.userData)}`);
    } else {
      log.error(`トークン検証テスト: 失敗 - ${verifyResult.error?.message || '不明なエラー'}`);
      throw new Error('トークン検証テストに失敗したため、テストを中断します');
    }
    
    // ステップ5: 保護されたエンドポイントへのアクセステスト
    log.info('\n5. 保護されたエンドポイントアクセステスト実行中...');
    const accessResult = await accessProtectedEndpoint(tokenResult.token);
    if (accessResult.success) {
      log.success('保護されたエンドポイントアクセステスト: 成功');
      log.info(`取得したデータ: ${JSON.stringify(accessResult.data)}`);
    } else {
      log.error(`保護されたエンドポイントアクセステスト: 失敗 - ${accessResult.error?.message || '不明なエラー'}`);
    }
    
    log.info('\n===== テスト完了 =====');
    log.info('全てのテストが完了しました');
    
  } catch (err) {
    log.error(`テストエラー: ${err.message}`);
    log.info('\n===== テスト中断 =====');
  }
}

// テスト実行
runTests().catch(err => {
  log.error(`予期せぬエラー: ${err.message}`);
}); 