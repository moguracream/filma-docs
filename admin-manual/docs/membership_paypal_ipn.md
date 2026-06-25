---
title: PayPal IPN連携で視聴権を付与する
---

# PayPal IPN連携で視聴権を付与する

PayPalの単発決済ボタンで購入が完了したタイミングに合わせて、Filmaの会員へ自動で視聴権を付与するためのガイドです。

この連携は **PayPal →（あなたのサーバー）→ Filma API** の順で動きます。Filma管理画面だけで完結する設定ではないため、受信サーバー側の準備が必要です。

## IPNとは（初心者向け）

IPN（Instant Payment Notification）は、PayPalが「決済結果」をあなたのサーバーへ自動通知する仕組みです。

- 通知は購入者のブラウザ経由ではなく、**PayPalからサーバーへ直接POST**されます。
- 通知は複数回届くことがあります（再送/リトライ）。そのため**二重付与防止**が必要です。

## 全体の流れ

1. 購入者がPayPalの決済ボタンで支払いを完了。
2. PayPalがIPN通知を、あなたのサーバーの受信URL（IPNリスナー）へ送信。
3. 受信サーバーが通知を検証し、購入者の会員を特定/作成して、Filmaの視聴権付与APIを呼び出す。

## 事前に決めること

### 1) どのスコープで付与するか

通常は **ITEM（視聴プラン単位）または SHOP（ショップ全体）** を推奨します。SKUは特殊用途（特定解像度/配信種別だけ許可したい場合）です。

### 2) PayPalの商品とFilmaの付与対象をどう対応させるか

商品数が増える可能性があるため、PayPal側には **「商品コード」だけを埋め込み、対応表はサーバー側で管理**する運用を推奨します。

例:
- PayPalボタンに `item_number=plan_basic` を設定
- 受信サーバーで `plan_basic → { scope_type: "item", item_id: 123 }` と対応づける

## PayPal側の設定（単発決済ボタン）

決済ボタン作成時に、以下の値を設定してください（ボタン作成担当者に依頼してもOKです）。

- **IPN通知先URL（notify_url）**
  IPNを受け取るあなたのサーバーのURL。ここにPayPalから通知が届きます。

- **商品コード（item_number）**
  どの商品が購入されたかを識別するコード。Filmaの付与対象を決めるために使います。

- **購入者識別用（custom）**
  会員が事前登録されていない場合に備えて、少なくとも **購入者のメールアドレス** を取得できるようにします。
  PayPalのIPNには `payer_email` が含まれるため、customにIDを入れなくても運用可能です。

## 受信サーバー側でやること（IPNリスナー）

IPNを受け取るサーバー側処理は、最低限次を行います。

1. **IPNの検証**（PayPal推奨の再POST検証）
   - PayPalへ同じデータを `cmd=_notify-validate` を付けて再POST
   - PayPalから `VERIFIED` が返ったものだけを処理
2. **支払いの妥当性確認**
   - `payment_status=Completed`
   - 受取アカウント（`receiver_email` など）が自分のPayPalアカウントと一致
   - 金額（`mc_gross`）・通貨（`mc_currency`）が想定と一致
3. **二重付与防止**
   - `txn_id`（取引ID）をキーに「処理済みか」を保存し、同じtxn_idは再処理しない
4. **購入者をFilma会員に紐づけ**
   - IPNの `payer_email` でFilma会員を検索
   - **存在しなければ会員を作成**
5. **Filmaの視聴権付与APIを呼ぶ**

## Filma APIの利用方法

Filma APIは **JWT認証（推奨）** と **APIキー認証** の両方に対応しています。
以下では、わかりやすさのためAPIキーの例に加えて、JWTの例も併記します。

### JWT認証（推奨）の準備

まずAPIキーでJWTトークンを発行し、そのトークンを以後のAPI呼び出しで利用します。

```bash
curl -X POST "https://filma.biz/filmaapi/token" \
  -H "X-API-KEY: <APIキー>"
```

レスポンスの `token` を取り出し、以降のリクエストで以下のように渡します。

```bash
-H "Authorization: Bearer <JWTトークン>"
```

### 会員の検索（payer_emailで照合）

まず、IPNで受け取った `payer_email` に一致するFilma会員が既に存在するかを確認します。
会員一覧APIはメールアドレスの部分一致検索に対応しているため、完全一致させたい場合は `query` にメール全体を渡します。

**APIキー認証の例（簡易）**
```bash
curl -X GET "https://filma.biz/filmaapi/customers?status=enabled&query=buyer%40example.com" \
  -H "X-API-KEY: <APIキー>"
```

**JWT認証の例（推奨）**
```bash
curl -X GET "https://filma.biz/filmaapi/customers?status=enabled&query=buyer%40example.com" \
  -H "Authorization: Bearer <JWTトークン>"
```

- `query`: 検索文字列（メールアドレスはURLエンコードします）
- `status=enabled`: 無効会員を除外したい場合に指定

レスポンスの `records` に一致する会員が入ります。
該当会員がいればその `id` を次の「視聴権の付与」で `:customer_id` として使用します。
該当会員がいなければ、次の手順で会員を作成します。

### 会員が存在しない場合の作成

Filma会員作成APIを使います（現行仕様では `email` と `name` が必須です。氏名を運用しない場合はメールアドレスなどを代入してください）。

**APIキー認証の例（簡易）**
```bash
curl -X POST "https://filma.biz/filmaapi/customers" \
  -H "X-API-KEY: <APIキー>" \
  -d "email=buyer@example.com" \
  -d "name=buyer@example.com" \
  -d "notes=PayPal購入で自動作成"
```

**JWT認証の例（推奨）**
```bash
curl -X POST "https://filma.biz/filmaapi/customers" \
  -H "Authorization: Bearer <JWTトークン>" \
  -d "email=buyer@example.com" \
  -d "name=buyer@example.com" \
  -d "notes=PayPal購入で自動作成"
```

レスポンスの `customer.id` がFilma会員IDです。

### 視聴権の付与

作成/検索した会員IDに対して、スコープに応じたエンドポイントを呼びます。

- shopスコープ
  `POST https://filma.biz/filmaapi/customers/entitlements/:customer_id?scope_type=shop&shop_id=<shop_id>`
- itemスコープ
  `POST https://filma.biz/filmaapi/customers/entitlements/:customer_id?scope_type=item&item_id=<item_id>`
- skuスコープ（特殊用途）
  `POST https://filma.biz/filmaapi/customers/entitlements/:customer_id?scope_type=sku&sku_id=<sku_id>`

**APIキー認証の例（簡易）**
```bash
curl -X POST \
  "https://filma.biz/filmaapi/customers/entitlements/1234?scope_type=item&item_id=5678" \
  -H "X-API-KEY: <APIキー>" \
  -d "starts_at=" \
  -d "expires_at=" \
  -d "status=active" \
  -d "source=paypal" \
  -d "notes=PayPal IPN"
```

**JWT認証の例（推奨）**
```bash
curl -X POST \
  "https://filma.biz/filmaapi/customers/entitlements/1234?scope_type=item&item_id=5678" \
  -H "Authorization: Bearer <JWTトークン>" \
  -d "starts_at=" \
  -d "expires_at=" \
  -d "status=active" \
  -d "source=paypal" \
  -d "notes=PayPal IPN"
```

## 運用チェックリスト

- PayPalのIPN履歴で通知が `VERIFIED` になっているか
- 受信サーバーのログで `txn_id` の二重処理が起きていないか
- Filma管理画面の会員詳細 → 視聴権一覧に付与が反映されているか
- 再生できない場合
  - 付与対象（shop/item/skuとID）が正しいか
  - 視聴プラン・SKU・Mediafileが有効/公開状態か
  - APIが `item_disabled` / `sku_disabled` を返していないか
