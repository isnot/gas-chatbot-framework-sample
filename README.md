# gas-chatbot-framework-sample

ChatBotを開発するための、フレームワークと、そのサンプルです。
Google Apps Scriptで動作します。
いまのところ、Telegram Bot APIと、LINE Messaging APIに対応しています。

現時点で、開発途中です。
フレームワーク的な構造は概ねできていて、プロトタイプのBotを、プライベート用途で運用中です。
そのプロトタイプから、フレームワーク部分を切り出して、パブリックにしたいのですが、まだ途上です。
本件サンプルでは、フレームワークとしての構造と、個別のアプリケーションとしての実装が、うまく分離できていないところがあります。
また、ドキュメントが未整備です。

以下は、メモ書き程度の不完全な文章です。
↓↓↓↓↓↓


このプロジェクトで使用する、スプシ（※サンプル）


# ごく簡単な説明

- Google Apps Script（通称GAS）で動かす
- コードはJavaScriptで書いている
- GASの、「V8 runtime」で動作する。ES2015の記法を積極的に使う
- 開発環境は、Node.js/npmで構築する
- LINEとTelegramに対応している（querystringを使って切り替えている）
- 設定やデータの保存先として、Googleスプレッドシートを使う
- 多機能なBotを開発、かつ機能追加がやりやすいことを意図して、プラグイン機構を組み込んでいる
- つくりかけ


# 今後

- ドキュメントが現状で皆無。APIリファレンス作りたい
- ユニットテスト欲しい
- CLIでプロジェクトの初期化、雛形作成したい
- 同じく、CLIでセットアップ処理（スプシの生成など）したい


# 内部のしくみ

- GASのWebアプリで、BotのWebhookを受ける
- GASで、Botの振る舞いを実装
- スプシは、概要、設定、ログ、マスターデータの、少なくとも5つのシートを持つ

code.js GAS側とのコネクター グローバルのfunction
doGet
doPost
    POST内容を保持
    config取得
    プラグイン呼び出し

bot.js Telegram Bot AppleBot commands
    コンテキスト依存の各種関数

utils.js 便利関数まとめ AppleUtils
    コンテキスト非依存の各種関数

model.js モデル・クラス AppleModel
    ログ書き出し
    設定読み込み
    マスターデータ読み込み
    マトリクス取得、保存
    getConfig
    getSheet

bot_api.js Bot API for GAS
    token type method keyboard sticker media

プラグイン
    初期化の実装
    user照合・登録・削除 user.isAdmin user.isValid chat.isValid

# framework


global contexts

name
filename
classname
description
help
regex
isEnabled
isAvailable
isLoaded
type

bot.js: getMessageDateTime()
bot.js: getChatTitle()
bot.js: getUserFullname()
bot.js: getChatFromConfig(config)

model.js: getSheet(sname)
model.js: loadSettings()
model.js: getSettings()
model.js: getArchiverSheet()
model.js: getArchiverSheetInfo()
model.js: appendLog()


utils.js: isIgnorePattern(target, ignore_keyword)
utils.js: matchCommand(target, regex)
utils.js: deepRetrieve(target, pos)
utils.js: formatBody(in_message)
utils.js: replaceCharactorEntity4TgHtml(text)
utils.js: hasProperty(obj, prop)

# plugins

plugin個別の基本情報登録（名前、関数、メタデータ等）

全てのメッセージを対象にする
or
正規表現にマッチする場合に対象にする

ヘルプに文言を追加→各プラグインのヘルプを統合する

設定シートに設定項目のデフォルト設定を追加

メッセージを送信（発信者の個別へ、発信元グループへ、Admin指定グループ｜個別へ）

発信元の個人・グループを一覧生成・管理→使用許可・不可設定可能

各plugin固有のデータを保持するシートを管理する


# 処理シーケンス

- 各ファイルの読み込み＆結合
  - getGlobalContexts() → cxはないものとする→空のオブジェクト生成
  - plugins→setup→cxに登録する
  - 各クラス定義する

- グローバル関数の呼び出し（例：doPost）
  - getGlobalContexts() → cxはあるものとする
  - 設定スプシのID確定→cxに保持
  - pluginsの順序決定
  - 特殊プラグイン（0番台）を実行
  - 00_init_各クラスに対応するインスタンスを生成
　- 01_security
  - 他のプラグインを順次実行する


# 最初の段階、プロジェクトを開始する

- clapをインストール、ログインする
- git clone
- npm install

# 開発のサイクル

- npm run ［lint, git-diff-lint, clap-diff, staging, deploy, build］
- claspからは、distディレクトリ配下のみを操作の対象にする
- distは、git管理の対象外

# 技術要素

GASの特性を考慮
一般的なクラス機構と比較して、特異な部分を説明します。

本件フレームワークでは、いくつかのまとまり毎に、具体例にはファイル単位でクラスを定義しています。
しかし、それらクラスから生成するインスタンス・オブジェクトには、具体例なインスタンス変数を持ちません。
また、クラスの振る舞いは、互いにあまり分離されていません。

代わりに、cxという単一のグローバル変数を使い、アプリケーション内の実行時コンテキストを保持する構成となっています。
いわば、GASの実行単位全体でひとつのインスタンスとして見立てているかのようです。

言ってみればこれは、オブジェクト指向におけるインスタンスの重要な役割のひとつである、カプセル化を放棄しています。
クラスに似せた部分もありながら、実質的にはまとまり毎に関数を束ねた入れ物に過ぎないのです。



# License
This software is released under the MIT License, see LICENSE
