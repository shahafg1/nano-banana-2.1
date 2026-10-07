---
name: nano-banana-2.1
description: "Generate and edit images, posters and visuals with Google's Nano Banana 2.1 (gemini-nano-banana-2.1). Asks for size, aspect ratio and thinking level when not given. Use for: create image, generate visual, AI image, marketing poster, thumbnail, banner, edit image with reference images. תמונה, פוסטר, יצירת תמונה, ויזואל, באנר, נאנו בננה."
version: "2.0.0"
tags:
  - image-generation
  - gemini
  - nano-banana
  - bilingual
---

# Nano Banana 2.1 — Image Generator / מחולל תמונות

Generates images with Google's **Nano Banana 2.1** (`gemini-nano-banana-2.1`) through the Gemini API. This is the only model the skill uses. Works in English and Hebrew (see the Hebrew section below).

## Before generating: ask the user (once, in one message)

If the user did **not** state a value, ask for these three together, in the user's language, with defaults marked. Skip any value they already gave. If they answer "defaults" / "ברירות מחדל", use the defaults and continue. **Never change a value on your own.**

| Setting | Options | Default |
|---|---|---|
| Size | `1K`, `2K`, `4K` | **2K** |
| Aspect ratio | `16:9`, `3:2`, `1:1`, `9:16`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `21:9` | **16:9** |
| Thinking level | `minimal` (fast), `medium`, `high` (most precise, slower) | **medium** |

Example question (English):
> Before I generate: size (1K / **2K** / 4K), ratio (**16:9** / 3:2 / 1:1 / 9:16 / other), and thinking level (minimal / **medium** / high)? Say "defaults" to use the bold ones.

## Run

```bash
cd ~/.claude/skills/nano-banana-2.1/scripts
npx ts-node generate_image.ts --aspect 16:9 --size 2K --thinking medium "Your prompt"
```

| Flag | Meaning |
|---|---|
| `--aspect`, `-a` | Aspect ratio (default `16:9`) |
| `--size`, `-s` | `1K` / `2K` / `4K` (default `2K`) |
| `--thinking`, `-t` | `minimal` / `medium` / `high` (default `medium`) |
| `--assets` | Comma-separated **full paths** to reference images (max 10). Never added automatically |
| `--search` | Ground the image in Google Search (current facts, e.g. today's weather, real data infographics) |
| `--batch-file F` | **Batch mode, half price**: one prompt per line in file F (`#` = comment). Waits up to `--batch-wait` seconds (default 120), otherwise prints a job name. Outputs `batch_<n>_0.<ext>` |
| `--batch-get NAME` | Collect results of an earlier batch job |
| `--output`, `-o` | Output folder (default: current directory) |
| `--save-to-gallery NAME` | Also save to `assets/gallery/NAME.<ext>` + `.meta.json` for later reuse via `--assets` |

Reference formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.
Output files: `image_0.<ext>`, `image_1.<ext>`… in the output folder.

### Examples

```bash
npx ts-node generate_image.ts "A futuristic city at sunset"
npx ts-node generate_image.ts -a 9:16 -s 4K -t high "Vertical story poster"
npx ts-node generate_image.ts --assets "/path/logo.png" "Banner using this logo"
npx ts-node generate_image.ts -o ~/Desktop "Workshop poster"
```

### Editing an existing image

Pass the previous image as a reference and describe only the change:

```bash
npx ts-node generate_image.ts --assets "/path/image_0.jpg" "Keep everything exactly the same, but change the background to light gray"
```

### When to use which mode

- **Single image now:** default command.
- **Facts that change (weather, prices, news, real places):** add `--search`.
- **Many images, not urgent:** `--batch-file` (half price; finished in ~1.5 minutes for 2 prompts in testing, can take longer under load).

## Pricing (standard, per image — check Google's pricing page for changes)

1K ≈ $0.034 · 2K ≈ $0.050 · 4K ≈ $0.113

## Hebrew / RTL content

When the image contains Hebrew text, **always** add to the prompt:

```
CRITICAL: All text must be in Hebrew.
CRITICAL: Layout direction is RTL (right-to-left).
Flow, reading order, and visual hierarchy must go from RIGHT to LEFT.
```

**Use `--thinking high` for any image with Hebrew text.** In testing, `minimal` garbled a Hebrew title (distorted letters) while `high` rendered all Hebrew text correctly (about 4x slower: ~60s vs ~16s). When the prompt contains Hebrew text, recommend `high` in the question. Always check the rendered text.

## Brand style

If `references/brand_style.local.txt` exists (private, git-ignored), read it and add its contents to the prompt whenever the user asks for an image in their brand style. `references/brand_style.txt` is a public template to copy from.

## API key

Set `GEMINI_API_KEY` in `scripts/.env` (see `SETUP.md`) or as a shell environment variable. Never paste the key into prompts, commits or chat.

---

# עברית

מייצר תמונות עם **Nano Banana 2.1** של גוגל (`gemini-nano-banana-2.1`) דרך Gemini API. זה המודל היחיד שהסקיל משתמש בו.

## לפני היצירה: לשאול את המשתמש (פעם אחת, בהודעה אחת)

אם המשתמש **לא** ציין ערך, שואלים על שלושת הערכים יחד, בשפה של המשתמש, כשברירות המחדל מסומנות. ערך שכבר נאמר – לא שואלים שוב. אם עונה "ברירות מחדל" – ממשיכים איתן. **לעולם לא משנים ערך מעצמנו.**

| הגדרה | אפשרויות | ברירת מחדל |
|---|---|---|
| גודל | `1K`, `2K`, `4K` | **2K** |
| יחס | `16:9`, `3:2`, `1:1`, `9:16`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `21:9` | **16:9** |
| רמת מאמץ (thinking) | `minimal` (מהיר), `medium`, `high` (מדויק יותר, איטי יותר) | **medium** |

דוגמת שאלה:
> לפני שאני מייצר: גודל (1K / **2K** / 4K), יחס (**16:9** / 3:2 / 1:1 / 9:16 / אחר), ורמת מאמץ (minimal / **medium** / high)? אפשר לענות "ברירות מחדל".

## מצבים נוספים

- `--search`: מבסס את התמונה על חיפוש Google (מידע עדכני: מזג אוויר, מחירים, חדשות).
- `--batch-file קובץ`: מצב Batch במחצית המחיר. פרומפט בכל שורה. ב-2 פרומפטים לקח כ-90 שניות. אם לא הסתיים, מודפס שם משימה, ואוספים אחר כך עם `--batch-get`.
- **עריכת תמונה קיימת:** מעבירים אותה ב-`--assets` ומתארים רק את השינוי ("שמור הכל זהה, שנה רק את הרקע").
- אם קיים `references/brand_style.local.txt` (פרטי, לא עולה ל-git), מוסיפים את תוכנו לפרומפט כשמבקשים סגנון מותג.

## הרצה

אותה פקודה והדגלים כמו בחלק האנגלי למעלה. ההפניות (`--assets`) הן נתיבים מלאים, ולא נוספות אוטומטית.

## טקסט בעברית

כשיש טקסט בעברית בתמונה, **תמיד** מוסיפים לפרומפט:

```
CRITICAL: All text must be in Hebrew.
CRITICAL: Layout direction is RTL (right-to-left).
Flow, reading order, and visual hierarchy must go from RIGHT to LEFT.
```

**לכל תמונה עם טקסט בעברית משתמשים ב-`--thinking high`.** בבדיקה, `minimal` שיבש כותרת בעברית (אותיות מעוותות), ו-`high` הוציא את כל הטקסט תקין (איטי פי 4 בערך: כ-60 שניות מול 16). כשיש טקסט בעברית בפרומפט – ממליצים על `high` בשאלה. תמיד בודקים את הטקסט שיצא.
