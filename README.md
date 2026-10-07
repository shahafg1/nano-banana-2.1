# nano-banana-2.1

A [Claude Code](https://claude.com/claude-code) skill that generates images and posters with Google's **Nano Banana 2.1** (`gemini-nano-banana-2.1`) through the Gemini API. English and Hebrew (RTL) supported.

סקיל ל-Claude Code ליצירת תמונות ופוסטרים עם **Nano Banana 2.1** של גוגל. תומך באנגלית ובעברית (RTL).

![Hebrew poster example](examples/hebrew-poster-high.jpg)

*Generated with `--thinking high`, 2K, 16:9 — all Hebrew text rendered correctly.*

## Features / יכולות

- Asks you for **size** (1K/2K/4K), **aspect ratio** and **thinking level** when you don't specify them — defaults: 2K, 16:9, medium.
  שואל על גודל, יחס ורמת מאמץ כשלא צוינו. ברירות מחדל: 2K, 16:9, medium.
- `--search` (Google Search grounding), `--batch-file` (half-price batch), editing via reference images.
- 10 aspect ratios, up to 10 reference images, optional gallery for reusing results.
- Hebrew/RTL prompt guidance. Tip: use `--thinking high` for Hebrew text — in our test `minimal` garbled a title, `high` was correct.

## Install / התקנה

```bash
git clone https://github.com/shahafg1/nano-banana-2.1.git ~/.claude/skills/nano-banana-2.1
cd ~/.claude/skills/nano-banana-2.1/scripts && npm install
cp .env.example .env   # then add your GEMINI_API_KEY
```

Get a key at https://aistudio.google.com/ . See [SETUP.md](SETUP.md). Your key stays on your machine in `scripts/.env`, which is git-ignored.

## Usage / שימוש

In Claude Code, just ask: "make me an image of …" / "תיצור לי פוסטר ל…". Or run directly:

```bash
cd scripts
npx ts-node generate_image.ts -a 16:9 -s 2K -t medium "A futuristic city at sunset"
```

| Flag | Values | Default |
|---|---|---|
| `-a, --aspect` | 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 | 16:9 |
| `-s, --size` | 1K, 2K, 4K | 2K |
| `-t, --thinking` | minimal, medium, high | medium |
| `--search` | ground in Google Search | off |
| `--batch-file` / `--batch-get` | half-price batch mode | – |
| `--assets` | comma-separated image paths (max 10) | – |
| `-o, --output` | output folder | `.` |
| `--save-to-gallery` | name | – |

## Cost

Approximate standard price per image (see Google's pricing page): 1K ≈ $0.034, 2K ≈ $0.050, 4K ≈ $0.113. You pay Google directly with your own API key.

## License

MIT — see [LICENSE](LICENSE).
