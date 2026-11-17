# Save Raju – setup (about 30 minutes)

## 1. Google Sheet (the score database)
1. Create a new Google Sheet, e.g. "Save Raju scores".
2. Extensions → Apps Script. Delete what's there, paste everything from Code.gs, click Save.
3. Deploy → New deployment → gear icon → Web app.
   - Execute as: Me
   - Who has access: Anyone
   Click Deploy and approve the permissions (Google may warn "unverified app": Advanced → Go to project).
4. Copy the Web app URL (ends in /exec).

## 2. Plug the URL into the two pages
Open index.html and leaderboard.html in any text editor and paste the URL between the quotes:
  const SHEET_URL = "https://script.google.com/macros/s/XXXX/exec";
(Or send the URL to Claude and it will do it.)

## 3. Host on GitHub Pages (free)
1. github.com → sign up / log in → New repository → name it save-raju → Public → Create.
2. "uploading an existing file" → drag in index.html and leaderboard.html → Commit changes.
3. Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save.
4. After ~1 minute your links are:
   Game:        https://YOURNAME.github.io/save-raju/
   Leaderboard: https://YOURNAME.github.io/save-raju/leaderboard.html
5. Put the game link into GAME_URL in leaderboard.html (and CLOSES_AT if you like), upload it again.

## 4. QR code
Make a QR code of the game link (e.g. qr-code-generator.com) for posters/table cards.
The leaderboard screen also shows the QR automatically once GAME_URL is set.

## 5. Test before the day
- Play 2–3 games on different phones on campus Wi-Fi.
- Check rows appear in the "Plays" tab of the sheet, and on the leaderboard within ~20 s.

## On the day
- Open the leaderboard link full-screen (F11) on the stand's TV/laptop.
- At closing time: the top row on the leaderboard is the winner; their email is in the sheet.
- Afterwards: delete the sheet (it contains emails).

Notes
- Each player's BEST score counts; unlimited attempts. Top 5 play a live final at the stand.
- Anti-cheat: 10 s per question; leaving the game mid-question = wrong answer (logged as Peeks);
  the sheet flags impossible or too-fast games in the Flag column and keeps them off the leaderboard.
  Before announcing, glance at the top players' rows (Peeks, Seconds, Flag).
- If you edit Code.gs later: Deploy → Manage deployments → edit → Version: New version → Deploy (the URL stays the same).
