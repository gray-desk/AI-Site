# Google AdSense 導入ガイド

このドキュメントでは、AI情報ブログにGoogle AdSense広告を導入する手順を説明します。

## 📋 前提条件

- Google AdSenseアカウントが承認済みであること
- サイトがAdSenseのポリシーに準拠していること
- コンテンツが十分にあること（10〜30記事程度推奨）

## 🎯 広告配置の最適化

サイトには以下の広告枠が用意されています:

### 1. **ヘッダー広告** (index.html)
- **位置**: メインコンテンツの上部
- **推奨サイズ**: 728x90 (Leaderboard) またはレスポンシブ
- **クラス**: `ad-container ad-header`
- **目的**: ファーストビューでの視認性

### 2. **記事上広告** (article-template.html)
- **位置**: 記事タイトルの直下
- **推奨サイズ**: 336x280 (Rectangle) またはレスポンシブ
- **クラス**: `ad-container ad-article-top`
- **目的**: 記事を読み始める前の注目度が高い位置

### 3. **記事中広告** (article-template.html)
- **位置**: 記事の途中（セクション間）
- **推奨サイズ**: 300x250 (Medium Rectangle)
- **クラス**: `ad-container ad-article-middle`
- **目的**: 自然な読書フローに溶け込む

### 4. **記事下広告** (article-template.html, index.html)
- **位置**: 記事またはコンテンツの最後
- **推奨サイズ**: レスポンシブ または 関連コンテンツ
- **クラス**: `ad-container ad-article-bottom`
- **目的**: 記事を読み終えた後のエンゲージメント

### 5. **サイドバー広告** (将来の拡張用)
- **位置**: コンテンツ右側
- **推奨サイズ**: 160x600 (Wide Skyscraper) または 300x600
- **クラス**: `ad-container ad-sidebar`
- **目的**: 長文記事での継続的な露出
- **注意**: モバイルでは自動的に非表示

## 🚀 実装手順

### ステップ1: AdSenseコードの取得

1. [Google AdSense](https://www.google.com/adsense/)にログイン
2. 「広告」→「広告ユニット」→「ディスプレイ広告」を選択
3. 広告ユニット名を入力（例: "ブログヘッダー広告"）
4. 広告サイズを選択（レスポンシブ推奨）
5. 「作成」をクリックしてコードを取得

### ステップ2: サイトへの広告コード挿入

#### 自動広告の場合（推奨）

`<head>`タグ内に以下のコードを追加:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

すべてのHTMLファイル（index.html, about.html, 記事テンプレート）に追加してください。

#### 手動広告の場合

各広告枠のHTMLコメントを外して、取得したコードに置き換えます:

**例: index.htmlのヘッダー広告**

```html
<!-- コメントアウトを解除 -->
<div class="inner">
  <div class="ad-container ad-header">
    <span class="ad-label">広告</span>
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"  ← 自分のパブリッシャーIDに置き換え
         data-ad-slot="1234567890"                  ← 広告スロットIDに置き換え
         data-ad-format="horizontal"
         data-full-width-responsive="true"></ins>
  </div>
</div>

<!-- 広告を初期化するスクリプト（ページ下部に追加） -->
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

### ステップ3: 広告の初期化スクリプト追加

各広告ユニットの直後または`</body>`の直前に以下を追加:

```html
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

### ステップ4: 自動生成記事への広告挿入

`automation/generator/index.js`の`compileArticleHtml()`関数を修正して、広告コードを自動挿入:

```javascript
// 記事上広告を追加
const articleTopAd = `
  <div class="ad-container ad-article-top">
    <span class="ad-label">広告</span>
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
         data-ad-slot="XXXXXXXXXX"
         data-ad-format="rectangle"
         data-full-width-responsive="true"></ins>
  </div>
`;

// 記事中広告（セクション2の後など）
const articleMiddleAd = `
  <div class="ad-container ad-article-middle">
    <span class="ad-label">広告</span>
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
         data-ad-slot="XXXXXXXXXX"
         data-ad-format="rectangle"></ins>
  </div>
`;
```

## 📱 モバイル対応

CSSで既にモバイル最適化が実装されています:

- サイドバー広告はモバイルで自動非表示
- 広告コンテナはレスポンシブで自動調整
- 最小高さを設定してレイアウトシフトを防止

## ⚠️ 注意事項

### AdSenseポリシー遵守

1. **クリックの誘導禁止**
   - 「広告をクリック」などの文言は使用しない
   - 広告の周りに矢印や枠で注意を引かない

2. **広告ラベルの使用**
   - 各広告に「広告」「スポンサーリンク」「AD」などのラベルを付ける
   - 既に`.ad-label`クラスで実装済み

3. **適切な広告密度**
   - コンテンツと広告のバランスを保つ
   - 1ページに広告が多すぎないように注意（推奨: 3〜5個）

4. **無効なクリック防止**
   - 自分で広告をクリックしない
   - 家族や友人にクリックを依頼しない

### パフォーマンス最適化

1. **遅延読み込み**
   - AdSenseコードは`async`属性付きで読み込み
   - 既に実装されているスケルトンローダーと相性が良い

2. **CLS対策**
   - 広告コンテナに`min-height`を設定済み
   - レイアウトシフトを最小限に抑える

## 🔍 テスト方法

### ローカルテスト
AdSenseはローカルホスト（`file://`）では動作しません。以下の方法でテスト:

1. **GitHub Pagesにデプロイ**
   - 本番環境で広告が正しく表示されるか確認

2. **テスト広告の使用**
   - 開発中は`data-adtest="on"`属性を追加
   ```html
   <ins class="adsbygoogle"
        data-adtest="on"
        ...>
   ```

### 広告の確認項目

- ✅ 広告が正しい位置に表示される
- ✅ モバイルでも適切に表示される
- ✅ レイアウトが崩れていない
- ✅ 「広告」ラベルが表示される
- ✅ ページ読み込み速度に大きな影響がない

## 📊 収益最適化のヒント

1. **質の高いコンテンツ**
   - 定期的に記事を更新
   - ユーザーに価値のある情報を提供

2. **トラフィックの増加**
   - SEO最適化（既に実装済み）
   - SNSでの共有促進

3. **広告配置の実験**
   - A/Bテストで最適な配置を見つける
   - AdSense自動広告を試す

4. **ページビューの追跡**
   - Google Analyticsと連携
   - 高パフォーマンスのページを分析

## 🆘 トラブルシューティング

### 広告が表示されない

1. AdSenseアカウントが承認されているか確認
2. パブリッシャーIDとスロットIDが正しいか確認
3. ブラウザの広告ブロッカーを無効化
4. コンソールエラーを確認（F12で開発者ツール）

### 広告表示が遅い

1. 広告コードが`async`で読み込まれているか確認
2. 他のスクリプトが重すぎないか確認
3. 画像の最適化

### ポリシー違反の警告

1. AdSenseダッシュボードで具体的な問題を確認
2. 該当箇所を修正
3. 再審査をリクエスト

## 📚 参考リンク

- [Google AdSense ヘルプセンター](https://support.google.com/adsense/)
- [AdSense プログラムポリシー](https://support.google.com/adsense/answer/48182)
- [広告配置の最適化](https://support.google.com/adsense/answer/9274025)

---

## 次のステップ

1. AdSenseアカウントを作成・申請
2. 承認後、自動広告コードを全ページに追加
3. 手動広告を配置したい場合、このガイドに従って実装
4. 数週間運用してパフォーマンスを分析
5. 必要に応じて広告配置を調整

**重要**: 広告を導入する前に、十分なコンテンツ（少なくとも10〜20記事）があることを確認してください。
