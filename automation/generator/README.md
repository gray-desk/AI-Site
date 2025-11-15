# generator

- collectorが抽出したキーワードを入力に受け取り、LLMや検索APIで補完情報を集めます。
- `automation/templates/article.md` をベースにMarkdownドラフトを生成し、`posts/generated-drafts/` に保存します。
- 記事公開前にファクトチェックや人手レビューを行う前提のため、生成物は必ず「ドラフト」として扱います。
