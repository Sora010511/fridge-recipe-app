# 冷蔵庫レシピ提案アプリ

冷蔵庫にある食材を登録すると、楽天レシピのランキングデータと照合してマッチ度の高いレシピを提案する、個人利用のWebアプリです。

## セットアップ

```bash
npm install
cp .env.example .env
```

`.env` を開いて `RAKUTEN_APP_ID` `RAKUTEN_ACCESS_KEY` `RAKUTEN_ORIGIN` を設定してください（取得方法は下記）。

## 楽天アプリID・アクセスキーの取得方法

2026年5月の楽天API仕様移行により、アプリケーションID単体ではなく、アクセスキーとOriginヘッダーが必須になっています。

1. https://webservice.rakuten.co.jp/ にアクセスし、楽天会員でログイン
2. 「アプリID発行」から新規アプリを登録（無料）。アプリケーションURLには公開されているURL（GitHubリポジトリ等）を入力する
3. アプリ管理画面（https://webservice.rakuten.co.jp/app/list ）で以下をそれぞれ `.env` に設定する
   - 「アプリケーションID」→ `RAKUTEN_APP_ID`
   - 「アクセスキー」（目のアイコンで表示）→ `RAKUTEN_ACCESS_KEY`
   - 登録した「アプリケーションURL」→ `RAKUTEN_ORIGIN`（そのままの値。APIリクエストのOriginヘッダーとして送信される）

すべて未設定の状態でもアプリは起動し、食材の登録・削除は利用できます。
「レシピを探す」を押した際にのみ、未設定である旨のメッセージが表示されます。

## 起動方法

```bash
npm start
```

`http://localhost:3000` （同一Wi-Fi内のスマホからは `http://<PCのIPアドレス>:3000`）でアクセスできます。

アクセスすると `APP_USERNAME` / `APP_PASSWORD`（簡易ログイン）を求められます。
未設定の場合、全リクエストが拒否されるので、必ず `.env` に設定してください。

## 外部（自宅Wi-Fi外）からアクセスしたい場合

ngrokトンネルを使って一時的な公開URLを発行できます。

1. https://ngrok.com/ で無料アカウントを作成
2. https://dashboard.ngrok.com/get-started/your-authtoken でauthtokenを取得し、`.env` の `NGROK_AUTHTOKEN` に設定
3. `.env` の `APP_USERNAME` / `APP_PASSWORD` を、推測されにくい値に変更しておく（初期値はセットアップ時の仮パスワード）
4. ターミナルを2つ開き、それぞれで以下を実行
   ```bash
   npm start        # ターミナル1：アプリ本体
   npm run tunnel    # ターミナル2：ngrokトンネル
   ```
5. `npm run tunnel` の出力に表示される `公開URL` にアクセスし、`APP_USERNAME` / `APP_PASSWORD` でログインする

**注意**
- 無料プランではトンネルを起動し直すたびにURLが変わります
- 公開中は誰でもそのURLにアクセスを試みる可能性があるため、`APP_PASSWORD` は必ず推測されにくいものに変更してください
- 使い終わったら `npm run tunnel` を `Ctrl+C` で終了すれば公開は止まります

## 設定項目（.env）

| 変数 | 説明 | 既定値 |
|---|---|---|
| `RAKUTEN_APP_ID` | 楽天ウェブサービスのアプリケーションID | （必須） |
| `RAKUTEN_ACCESS_KEY` | 楽天ウェブサービスのアクセスキー | （必須） |
| `RAKUTEN_ORIGIN` | 楽天アプリ登録時の「アプリケーションURL」と同じ値 | （必須） |
| `PORT` | サーバーのポート番号 | 3000 |
| `RECIPE_CATEGORY_LIMIT` | レシピ検索時に問い合わせる中カテゴリの件数上限。多いほど候補レシピが増えるが楽天APIの呼び出し回数も増える | 20 |
| `APP_USERNAME` / `APP_PASSWORD` | 簡易ログイン（Basic認証）の資格情報 | （必須） |
| `NGROK_AUTHTOKEN` | ngrokで外部公開する場合のみ必要 | （外部公開時のみ必須） |

## データ

- 食材リストは `data/app.db`（SQLite）に保存され、サーバーを再起動しても保持されます。
- レシピ情報は都度楽天APIから取得し、メモリ上に一定時間キャッシュします（DBには保存しません）。
