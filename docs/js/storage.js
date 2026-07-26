// storage.js — save/load the parsed bracket and create/validate local pool backups.
// Nothing is ever uploaded. Namespaces the "what-if" score overrides per bracket so
// two different uploads on the same device don't leak edits into each other.
const KEY = "wcb.fan.picks.v1";
const KEY_HASH = "wcb.fan.hash";
const KEY_SCORES = "wcb.scores.v3";   // the interaction layer's manual overrides

function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
let _storageWarned = false;
function safeSet(k, v) {
  try { localStorage.setItem(k, v); return true; }
  catch (e) {   // Safari private mode / quota: tell the app once so it can notify the user
    if (!_storageWarned) { _storageWarned = true; try { window.dispatchEvent(new CustomEvent("wcb:storage-blocked")); } catch (_) {} }
    return false;
  }
}
function safeDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

export function savePicks(picks) { return safeSet(KEY, JSON.stringify(picks)); }
export function loadPicks() {
  const s = safeGet(KEY);
  if (!s) return null;
  try { return JSON.parse(s); } catch (e) { return null; }
}
export function clearPicks() { safeDel(KEY); safeDel(KEY_HASH); safeDel(KEY_SCORES); }

// Small stable hash of the identifying parts of a bracket.
export function hashPicks(picks) {
  const s = JSON.stringify([picks.entrant, picks.r32, picks.r16_win, picks.qf_win, picks.sf_win, picks.champ]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// Preview renders (demo / shared link) must not destroy the owner's what-if edits:
// stash the real state before the preview, restore it when the owner's bracket
// returns. stash is only written when absent, so back-to-back previews (demo then a
// shared link) can't overwrite the real state with a preview's.
const KEY_STASH = "wcb.scores.stash";
export function stashWhatIfs() {
  if (safeGet(KEY_STASH) != null) return;
  const h = safeGet(KEY_HASH), s = safeGet(KEY_SCORES);
  if (h != null || s != null) safeSet(KEY_STASH, JSON.stringify({ h, s }));
}
export function restoreWhatIfs() {
  const raw = safeGet(KEY_STASH);
  if (!raw) return;
  try {
    const { h, s } = JSON.parse(raw);
    if (h != null) safeSet(KEY_HASH, h); else safeDel(KEY_HASH);
    if (s != null) safeSet(KEY_SCORES, s); else safeDel(KEY_SCORES);
  } catch (e) {}
  safeDel(KEY_STASH);
}

// Clear per-pick what-if overrides when a DIFFERENT bracket is loaded (their IDs like
// "r32-M74" are entrant-relative and would otherwise haunt the next upload).
export function resetWhatIfsIfChanged(picks) {
  const h = hashPicks(picks);
  if (safeGet(KEY_HASH) !== h) { safeDel(KEY_SCORES); safeSet(KEY_HASH, h); }
}

export const POOL_BACKUP_FORMAT = "mywcbracket-pool-backup";
export const POOL_BACKUP_VERSION = 1;

export function createPoolBackup(picks, rivals) {
  return {
    format: POOL_BACKUP_FORMAT,
    version: POOL_BACKUP_VERSION,
    bracket: picks,
    leaderboard: Array.isArray(rivals) ? rivals : [],
  };
}

export function isPoolBackup(value) {
  return !!value && typeof value === "object" && value.format === POOL_BACKUP_FORMAT;
}

export class PoolBackupError extends Error {
  constructor(problems) {
    const list = Array.isArray(problems) ? problems : [String(problems)];
    super(list.join(" "));
    this.name = "PoolBackupError";
    this.problems = list;
  }
}

export function validatePoolBackup(value, validatePicks) {
  if (!isPoolBackup(value))
    throw new PoolBackupError("This JSON is not a pool backup from this site.");
  if (value.version !== POOL_BACKUP_VERSION)
    throw new PoolBackupError(`This pool backup uses version ${String(value.version ?? "unknown")}; this site supports version ${POOL_BACKUP_VERSION}.`);
  if (!value.bracket || typeof value.bracket !== "object")
    throw new PoolBackupError("The pool backup is missing your bracket.");
  if (!Array.isArray(value.leaderboard))
    throw new PoolBackupError("The pool backup has an invalid leaderboard.");

  const validate = (picks, label) => {
    try { return validatePicks(picks); }
    catch (e) {
      const problems = Array.isArray(e && e.problems) ? e.problems : [e && e.message ? e.message : String(e)];
      throw new PoolBackupError(problems.map(p => `${label}: ${p}`));
    }
  };
  const bracket = validate(value.bracket, "Your bracket");
  const leaderboard = value.leaderboard.map((entry, i) => {
    const label = `Leaderboard entry ${i + 1}`;
    if (!entry || typeof entry !== "object" || !entry.picks || typeof entry.picks !== "object")
      throw new PoolBackupError(`${label} is missing its bracket.`);
    if (entry.alias != null && typeof entry.alias !== "string")
      throw new PoolBackupError(`${label} has an invalid local alias.`);
    if (entry.added != null && typeof entry.added !== "string")
      throw new PoolBackupError(`${label} has an invalid saved date.`);
    const rival = { picks: validate(entry.picks, label) };
    const alias = String(entry.alias || "").trim().slice(0, 40);
    if (alias) rival.alias = alias;
    if (entry.added) rival.added = entry.added;
    return rival;
  });
  return { bracket, leaderboard };
}

export function exportPoolBackup(picks, rivals) {
  const blob = new Blob([JSON.stringify(createPoolBackup(picks, rivals), null, 1)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = String(picks.entrant || "bracket").replace(/[^\w.-]+/g, "_") + "-pool-backup.json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
