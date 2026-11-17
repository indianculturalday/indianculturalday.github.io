/**
 * SAVE RAJU – score collector + leaderboard API (Google Apps Script)
 *
 * Setup: Google Sheet > Extensions > Apps Script > paste this file > Save
 *        Deploy > New deployment > type "Web app" > Execute as: Me > Who has access: Anyone > Deploy
 *        Copy the URL ending in /exec into SHEET_URL in index.html AND leaderboard.html.
 * After editing this script later: Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy.
 */
const SHEET_NAME = 'Plays';
const HEADERS = ['Time', 'Nickname', 'Player ID', 'Event', 'Result', 'Score', 'Correct', 'Answered', 'Run ID', 'Device', 'Peeks', 'Seconds', 'Flag', 'Counts', 'Email'];
const SECS_PER_Q = 10, MAX_PER_Q = 100 + SECS_PER_Q * 10;   // must match the game
const MAX_QUESTIONS = 200;          // survival mode: generous upper bound
const FIRST_GAME_ONLY = true;        // only each player's first finished game counts

// Game -> sheet: one row when a game starts, one when it finishes
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');
    const player = String(d.player || '').replace(/[^\w-]/g, '').slice(0, 40);
    const nick = String(d.nick || '').replace(/[<>]/g, '').trim().slice(0, 16);
    const email = String(d.email || '').trim().toLowerCase().slice(0, 120);
    if (!player || !nick || !/^[^\s@]+@insead\.edu$/.test(email)) return json({ ok: false, error: 'bad player' });
    const sh = sheet(), now = new Date();
    const event = String(d.event || '').slice(0, 20), run = String(d.run || '').slice(0, 20);
    const score = Number(d.score) || 0, correct = Number(d.correct) || 0, answered = Number(d.answered) || 0;
    let secs = '', flag = '';
    if (event === 'finish') {
      // sanity checks: a real game has a start row, takes time, and can't beat the maximum points
      const hit = run ? sh.createTextFinder(run).matchEntireCell(true).findAll()
        .map(r => sh.getRange(r.getRow(), 1, 1, 4).getValues()[0]).find(v => v[3] === 'start') : null;
      if (!hit) flag = 'no start';
      else {
        secs = Math.round((now - new Date(hit[0])) / 1000);
        if (secs < answered * 1.2) flag = 'too fast';
      }
      if (score < 0 || score > correct * MAX_PER_Q || correct > answered || answered > MAX_QUESTIONS) flag = (flag ? flag + ', ' : '') + 'impossible score';
    }
    sh.appendRow([now, nick, player, event, String(d.result || '').slice(0, 20), score, correct, answered, run,
      String(d.ua || '').slice(0, 120), Number(d.peeks) || 0, secs, flag, d.counted === false ? 'practice' : 'yes', email]);
    CacheService.getScriptCache().remove('top');
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Sheet -> leaderboard: each player's first game (or best game if FIRST_GAME_ONLY is false)
function doGet(e) {
  const p = (e && e.parameter) || {};
  const cache = CacheService.getScriptCache();
  let data = cache.get('top');
  if (!data) {
    const rows = sheet().getDataRange().getValues().slice(1);
    const best = {};
    let games = 0;
    rows.forEach(r => {
      if (r[3] !== 'finish') return;
      games++;
      const key = String(r[14] || r[2]);   // one player = one INSEAD email
      const t = new Date(r[0]).getTime();
      if (FIRST_GAME_ONLY) {
        if (best[key]) { if (best[key]) best[key].plays++; return; }   // only the first finished game counts
        if (r[12]) { best[key] = { nick: r[1], score: -1, correct: 0, plays: 1, t: t, flagged: true }; return; }
        best[key] = { nick: r[1], score: r[5], correct: r[6], plays: 1, t: t };
        return;
      }
      if (r[12]) return;   // flagged games never reach the leaderboard
      const b = best[key] || (best[key] = { nick: r[1], score: -1, correct: 0, plays: 0, t: 0 });
      b.plays++;
      if (r[5] > b.score || (r[5] === b.score && t < b.t)) { b.score = r[5]; b.correct = r[6]; b.t = t; b.nick = r[1]; }
    });
    const list = Object.values(best).filter(x => !x.flagged && x.score >= 0).sort((a, b) => b.score - a.score || a.t - b.t);
    data = JSON.stringify({ ok: true, players: list.length, games: games, updated: new Date().toISOString(),
      top: list.slice(0, 25).map(x => ({ nick: x.nick, score: x.score, correct: x.correct, plays: x.plays })) });
    cache.put('top', data, 15);
  }
  if (p.callback && /^[A-Za-z_$][\w$]{0,40}$/.test(p.callback)) {
    return ContentService.createTextOutput(p.callback + '(' + data + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
