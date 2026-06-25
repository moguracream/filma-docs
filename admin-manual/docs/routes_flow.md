---
title: 画面URLと遷移
---

# 画面URLと遷移

## 主なURL一覧

- ログイン: `/filmaadmin`
- ダッシュボード: `/filmaadmin/dashboard`
- ファイル一覧: `/filmaadmin/file`
- フォルダ一覧: `/filmaadmin/folder`
- ユーザー一覧: `/filmaadmin/user`
- ファイル編集: `/filmaadmin/file/edit/:file_id`
- ファイル詳細: `/filmaadmin/file/detail/:file_id`
- アップロード: `/filmaadmin/file/upload/:folder_id`
- API設定編集: `/filmaadmin/apisettings/edit/:user_id`
- 期限付きURL: 発行 `/filmaadmin/signedurl/issue/:mediafile_id` / 一覧 `/filmaadmin/signedurl/list/:file_id` または `/filmaadmin/signedurl/list?mediafile_id=:mediafile_id` / 詳細 `/filmaadmin/signedurl/detail/:signed_url_id`

## 遷移図（フローチャート）

```mermaid
flowchart TB
  %% 認証
  login["ログイン<br/>`/filmaadmin`"]
  verify["認証コード入力<br/>`/filmaadmin/verify`"]
  dashboard["ダッシュボード<br/>`/filmaadmin/dashboard`"]

  %% 一覧・詳細・編集・アップロード
  file_list["ファイル一覧<br/>`/filmaadmin/file`"]
  file_list_f["ファイル一覧（フォルダ指定）<br/>`/filmaadmin/file/:id`"]
  file_detail["ファイル詳細<br/>`/filmaadmin/file/detail/:file_id`"]
  file_edit["ファイル編集<br/>`/filmaadmin/file/edit/:file_id`"]
  upload["アップロード<br/>`/filmaadmin/file/upload/:id`"]

  %% 期限付きURL
  su_list["期限付きURL一覧<br/>`/filmaadmin/signedurl/list/:file_id`<br/>または<br/>`/filmaadmin/signedurl/list?mediafile_id=:mediafile_id`"]
  su_issue["期限付きURL発行<br/>`/filmaadmin/signedurl/issue/:mediafile_id`"]
  su_detail["期限付きURL詳細<br/>`/filmaadmin/signedurl/detail/:signed_url_id`"]
  su_edit["期限付きURL編集<br/>`/filmaadmin/signedurl/edit/:signed_url_id`"]

  %% ユーザー・API設定
  users["ユーザー一覧<br/>`/filmaadmin/user`"]
  api_edit["API設定編集<br/>`/filmaadmin/apisettings/edit/:user_id`"]

  %% 認証フロー
  login -->|ログイン成功| dashboard
  login -->|認証コード送信| verify -->|成功| dashboard

  %% アップロード/公開フロー
  dashboard -->|クイック操作| upload -->|完了| file_list_f
  file_list -->|編集| file_edit -->|保存| file_detail

  %% 期限付きURLフロー
  file_detail -->|一覧| su_list
  su_list -->|新規発行| su_issue -->|保存| su_list
  su_list -->|詳細| su_detail -->|メモを編集| su_edit

  %% 埋め込みHTML 初回準備
  users -->|デフォルトAPIユーザー| api_edit
  file_detail -.->|埋め込みHTMLをコピー| file_detail
```

---

## 遷移図（テキスト）

### 認証:
- ログイン（`/filmaadmin`）<br>
→ ログイン成功<br>
→ ダッシュボード（`/filmaadmin/dashboard`）
- ログイン（`/filmaadmin`） <br>
→ 認証コード送信 <br>
→ 認証コード入力（`/filmaadmin/verify`） <br>
→ 成功 <br>
→ ダッシュボード（`/filmaadmin/dashboard`）

### アップロード/公開:
- ダッシュボード（`/filmaadmin/dashboard`） <br>
→ クイック操作 <br>
→ アップロード（`/filmaadmin/file/upload/:id`） <br>
→ 完了 <br>
→ ファイル一覧（`/filmaadmin/file/:id`）
- ファイル一覧（`/filmaadmin/file`） <br>
→ 「編集」<br>
→ ファイル編集（`/filmaadmin/file/edit/:file_id`） <br>
→ 保存 <br>
→ ファイル詳細（`/filmaadmin/file/detail/:file_id`）

### 期限付きURL:
- ファイル詳細（`/filmaadmin/file/detail/:file_id`） <br>
→ 「期限付きURL一覧」<br>
→ 期限付きURL一覧（`/filmaadmin/signedurl/list/:file_id` または `/filmaadmin/signedurl/list?mediafile_id=:mediafile_id`）
- 期限付きURL一覧 <br>
→ 「新規発行」<br>
→ 期限付きURL発行（`/filmaadmin/signedurl/issue/:mediafile_id`） <br>
→ 保存 <br>
→ 一覧に反映
- 期限付きURL一覧 <br>
→ 「詳細」<br>
→ 期限付きURL詳細（`/filmaadmin/signedurl/detail/:signed_url_id`） <br>
→ 「メモを編集」<br>
→ 期限付きURL編集（`/filmaadmin/signedurl/edit/:signed_url_id`）

### 埋め込みHTML 初回準備:
- ユーザー一覧（`/filmaadmin/user`） <br>
→ デフォルトAPIユーザー <br>
→ API設定編集（`/filmaadmin/apisettings/edit/:user_id`）でアクセス許可ドメイン設定
- ファイル詳細（`/filmaadmin/file/detail/:file_id`） <br>
→ 「埋め込みHTMLをコピー」<br>
→ 自サイトへ貼付け

### ユーザー管理:
- ユーザー一覧（`/filmaadmin/user`） <br>
→ 新規/編集/削除 <br>
→ 詳細/一覧
