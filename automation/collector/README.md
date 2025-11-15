# collector

- `sources.json` をもとに対象YouTubeチャンネルの最新動画を取得します。
- MVPではまだAPIコールを実装していません。`collect-notes.md` などで観測ログを残し、後続処理に渡す想定です。
- 実装時は `scripts` ディレクトリにAPIキーを置かず、必ず GitHub Secrets から読み込んでください。
