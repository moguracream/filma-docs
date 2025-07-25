# Filma - 動画配信プラットフォーム (PaaS)
**Filma**は、開発者向けの動画配信プラットフォーム (Platform as a Service) です。
本リポジトリでは、Filmaの[APIリファレンス](api_specification.md)やサンプルコードを公開しています。ご契約前から使用感をご確認いただけますので、ぜひお試しください。

ウェブ制作ができる方なら、誰でも簡単に動画配信サイトを作成することができます。プログラマがいなくても大丈夫です。サンプルコードをコピペして修正するだけです。

## 🚀 Filmaとは？

MPEG-DASHによるアダプティブストリーミング配信を、Windows, Mac, iOS, Android, Chrome OSなど、さまざまなプラットフォームで実現します。
マルチDRM (Widevine, PlayReady, FairPlay) に対応し、お客様の貴重なコンテンツを高度なコピー防止技術で保護します。

### 主な活用事例
- セミナー・講演アーカイブ配信
- サブカル系オリジナル動画サービスの構築
- 会員制サロンの動画販売
- プレミアムコンテンツ販売/配信
- インフルエンサーのYoutubeでは言えない本音配信

## ✨ 主な機能

  * **アダプティブストリーミング**: MPEG-DASHにより、視聴者の通信環境に応じて最適な画質を自動で選択し、スムーズな再生を提供します。
  * **マルチプラットフォーム対応**: Windows, Mac, iOS, Android, Chrome OSなど、主要なOSで再生可能です。
  * **強力なコンテンツ保護**: マルチDRM (Widevine, PlayReady, FairPlay) に標準対応し、不正なコピーやダウンロードを防ぎます。アップロードするだけで自動暗号化されますので、DRMの知識がなくても誰でも簡単にご利用いただけます。
  * **シンプルなワークフロー**:
    1.  使いやすいウェブ管理画面から動画ファイルをアップロード。
    2.  エンコード・暗号化はすべて自動で完了。
    3.  APIキーを使ってHTML/JavaScriptコードをサイトに埋め込むだけで、すぐに再生開始。
  * **大規模なインフラ**:
      * 数ペタバイト級の大容量ストレージを完備。
      * 専用の高速回線を利用。
      * **安価な配信コスト**: クラウドや大手CDNを経由しない独自のインフラにより、低コストでの配信を実現しています。
          * *注意: この構成により、海外からの再生は低速になる場合があります。*
  * **豊富な実績**: 20年間で数十億円相当のプレミアムコンテンツを安定して配信してきた実績があります。
  * 完全な国産プラットフォームですので、日本法を遵守したコンテンツであれば何でも配信可能です。

## 🔧 開発者向け情報 (For Developers)

本リポジトリでは、Filmaをより深く理解し、スムーズに導入していただくための技術情報を提供しています。

  * **[APIリファレンス](api_specification.md)**: 詳細なAPI仕様をご確認いただけます。
  * **サンプルコード**: すぐに試せる実装例をご用意しています。
    * **[認証無し動画サンプル](/template-no-auth)**: 認証なしで誰でも見られる動画再生のサンプルコードです。

## 💲 価格

自社配信システムにより、極めて競争力のある価格を実現しております。

| プラン      | 月額       | 転送量 | 保存容量 | 機能        |
|-------------|------------|--------|----------|-------------|
| Free        | ¥0         | ご相談 | ご相談   | 無料配信専用・審査制・広告付き |
| Standard    | ¥49,800    | 10TB   | 10TB     | DRM非対応, 無料配信可, 有料配信可, 会員制配信可 |
| Pro         | ¥98,000    | 50TB   | 50TB     | DRM対応, 無料配信可, 有料配信可, 会員制配信可      |
| Enterprise  | ご相談     | 100TB~ | ご相談   | ご相談       |
| 超過転送量     | ¥1,000     | 100GB  | —        |             |
| 超過保存量     | ¥1,000     | —    | 100GB        |             |

※ Freeプランは、ご紹介または既存のお取引先様に限りご利用いただけます（審査あり）。インフルエンサー様などに広告モデルでご利用いただくことを想定しております。

※ 年額プランは2ヶ月分お得！（約17%オフ）先払い・解約不可となります。

※ 銀行振込をご希望の方は、年額プラン（先払い・解約不可）でのご契約に限らせていただきます。  
　月額プランをご希望の方は、クレジットカード決済をご利用ください。

## 📞 お問い合わせ

### お問い合わせ先

現在、ローンチ直後のため、申し込みは、原則として紹介制とさせて頂いております。ご迷惑をおかけいたしますが、一般提供開始まで、しばらくお待ちください。

### 機能のご要望について

Filmaは現在、機能追加や拡張を積極的に行っています。「こんな機能が欲しい」といったご要望がありましたら、ぜひお聞かせください。

## ❓ よくあるご質問

### プランの変更は可能ですか？

StandardプランからProプランへのアップグレードは可能ですが、アップロード済み動画にDRMを付与する場合は、再エンコードが必要となります。再エンコードは弊社サーバ内で順次処理していきますので、動画ファイル数が多い場合には、長時間かかることが考えられます。

ProプランからStandardプランへのダウングレードも可能ではありますが、DRMを外すための再エンコード中は動画が視聴不能となってしまいますので、お勧めはしません。

Freeプランはインフルエンサー様専用となっておりますので、詳細はお問合せください。

## 📜 ご利用規約

- [ご利用規約](terms_of_service_template.md)
- [サービスレベルアグリーメント](service_level_agreement.md)

## 🏢 提供会社

- [株式会社クリーム](https://cream.co.jp/)
