# Setup / התקנה

## English
1. Get a Gemini API key at https://aistudio.google.com/ ("Get API key").
2. Install Node.js (v18+).
3. Install dependencies:
   ```bash
   cd scripts && npm install
   ```
4. Provide your key — **either**:
   - `cp .env.example .env` and put your key in `scripts/.env`, **or**
   - export `GEMINI_API_KEY` in your shell profile.
   The `.env` file is git-ignored. Never commit or share your key.
5. Test:
   ```bash
   npx ts-node generate_image.ts "A beautiful sunset over mountains"
   ```

| Issue | Fix |
|---|---|
| 401 / 403 | Check the API key |
| 429 | Rate limit or quota — wait, or check billing |
| "No image returned" | Prompt probably hit safety filters; rephrase |

## עברית
1. מקבלים מפתח Gemini API ב-https://aistudio.google.com/ (Get API key).
2. מתקינים Node.js (גרסה 18+).
3. מתקינים תלויות: `cd scripts && npm install`
4. מגדירים את המפתח: מעתיקים `.env.example` ל-`.env` ושמים בו את המפתח, או מגדירים `GEMINI_API_KEY` בפרופיל ה-shell. קובץ `.env` לא עולה ל-git. לא משתפים את המפתח אף פעם.
5. בדיקה: `npx ts-node generate_image.ts "שקיעה מעל הרים"`
