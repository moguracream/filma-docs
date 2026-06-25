---
title: はじめに
---

# Filma 管理画面 運用マニュアル

このマニュアルは、Filma の管理画面（/filmaadmin）で日常的に行う運用作業（ログイン、動画のアップロード/公開、埋め込み、期限付きURL、ユーザー管理など）の手順をまとめたものです。

## 対象読者

- 組織管理者・運用担当者（一般ユーザー・APIユーザー管理を含む）

## 表記の約束

- 「ファイル」= 動画、「フォルダ」= 動画の入れ物
- 公開をONにすると外部から参照可能。公開期限で自動停止可能

## よく使うURL

- ログイン: `/filmaadmin`
- ダッシュボード: `/filmaadmin/dashboard`
- ファイル一覧: `/filmaadmin/file`
- フォルダ一覧: `/filmaadmin/folder`
- ユーザー一覧: `/filmaadmin/user`
- API設定編集: `/filmaadmin/apisettings/edit/:user_id`
- 期限付きURL: 発行 `/filmaadmin/signedurl/issue/:mediafile_id` / 一覧 `/filmaadmin/signedurl/list/:file_id` または `/filmaadmin/signedurl/list?mediafile_id=:mediafile_id`

## クイックスタート（最短ルート）

1. ダッシュボード → 「クイック操作」でアップロード先フォルダへ → 動画をアップロード（詳細: [動画のアップロード](upload.md)）
2. ファイル編集 → 「公開する」ON、必要に応じて公開期限を設定（詳細: [動画の公開](publish.md)）
3. 「派生メディア」から「埋め込みHTMLをコピー」→ 自サイトへ貼付（詳細: [埋め込みHTML](embed_html.md)）
4. もしくは「期限付きURL」を発行して共有（詳細: [期限付きURLの発行](signedurl.md)）

> 重要: 埋め込みHTMLでも「アクセス許可ドメイン」の設定が必要です。初期アカウント発行時に自動作成される「デフォルトのAPIユーザー」の API 設定で、自サイトのドメイン名を登録してください（サブドメイン可。例: example.com / app.example.com）。

## やりたいこと別ショートカット

- ログインしたい: [ログイン](login.md)
- 動画をアップロードしたい: [動画のアップロード](upload.md)
- 動画を公開したい: [動画の公開](publish.md)
- サイトに埋め込みたい（HTML）: [埋め込みHTML](embed_html.md)
- サイトに埋め込みたい（API）: [APIを使った埋め込み](embed_api.md)
- 期限付きURLを発行・管理したい: [期限付きURLの発行](signedurl.md)
- DRM化したい: [DRM化](drm.md)
- 動画を非公開/削除したい: [非公開化・削除](unpublish_delete.md)
- ユーザーを管理したい: [ユーザーの種類](users.md)
- 画面URLと遷移を確認したい: [画面URLと遷移](routes_flow.md)
- API仕様を画面で確認したい: [Filma API仕様書（Web版）](https://moguracream.github.io/filma-docs/api-spec/)
