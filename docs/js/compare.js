// compare.js — the local pool leaderboard. Rivals live ONLY in this browser
// (localStorage). No network anywhere in this file, by design
// (dev-docs/[01]-zero-backend-social-loop/BRIEF.md invariant 7):
// entries arrive through owner-created share links or an explicit private pool backup.
import { computeState } from "./render.js";
import { hashPicks, loadPicks } from "./storage.js";

const KEY_RIVALS = "wcb.rivals.v1";
export const RIVALS_CAP = 20;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── rivals storage (thin; Safari-private-mode safe) ─────────────────────────
export function loadRivals() {
  try { return JSON.parse(localStorage.getItem(KEY_RIVALS) || "[]") || []; } catch (e) { return []; }
}
export function saveRivals(list) {
  try { localStorage.setItem(KEY_RIVALS, JSON.stringify(list)); return true; }
  catch (e) {
    try { window.dispatchEvent(new CustomEvent("wcb:storage-blocked")); } catch (_) {}
    return false;
  }
}

export function mergeRivals(existing, incoming, ownerPicks) {
  const rivals = [];
  const seen = new Set();
  const ownerHash = ownerPicks ? hashPicks(ownerPicks) : null;
  let added = 0, duplicates = 0, own = 0, overCap = 0;

  for (const rival of Array.isArray(existing) ? existing : []) {
    const h = hashPicks(rival.picks);
    if (h === ownerHash) { own++; continue; }
    if (seen.has(h)) { duplicates++; continue; }
    seen.add(h);
    rivals.push(rival);
  }

  for (const rival of Array.isArray(incoming) ? incoming : []) {
    const h = hashPicks(rival.picks);
    if (h === ownerHash) { own++; continue; }
    if (seen.has(h)) { duplicates++; continue; }
    if (rivals.length >= RIVALS_CAP) { overCap++; continue; }
    seen.add(h);
    rivals.push(rival);
    added++;
  }

  return { rivals, added, duplicates, own, overCap };
}
// entry: { picks, alias? (local display override), added: iso }
export function addRival(picks) {
  const list = loadRivals();
  const h = hashPicks(picks);
  if (list.some(r => hashPicks(r.picks) === h)) return { ok: true, dup: true, count: list.length };
  if (list.length >= RIVALS_CAP)
    return { ok: false, reason: `Your leaderboard is full (${RIVALS_CAP} brackets) — remove one to add another.` };
  list.push({ picks, added: new Date().toISOString() });
  saveRivals(list);
  return { ok: true, dup: false, count: list.length };
}
export function removeRival(hash) { saveRivals(loadRivals().filter(r => hashPicks(r.picks) !== hash)); }
export function renameRival(hash, alias) {
  const list = loadRivals();
  for (const r of list) if (hashPicks(r.picks) === hash) r.alias = String(alias || "").trim().slice(0, 40);
  saveRivals(list);
}

// ── pure core (unit-tested in tests/compare.mjs) ────────────────────────────
export function standings(brackets, live, topology, stateForPicks = null) {
  // brackets: [{picks, you?, alias?}] -> ranked display rows
  const rows = brackets.map(({ picks, you, alias }) => {
    const D = stateForPicks ? stateForPicks(picks) : computeState(picks, live, topology);
    return { you: !!you, name: alias || picks.entrant || "?", conf: D.CONF, live: D.LIVE,
             attain: D.ATTAIN, champ: D.CHAMP, champAlive: D.CHAMP_ALIVE, hash: hashPicks(picks) };
  });
  rows.sort((a, b) => (b.conf - a.conf) || (b.attain - a.attain) || a.name.localeCompare(b.name));
  return rows;
}

// Differences that still matter: undecided slots only, biggest points first.
// KO slots are compared by bracket position (match code), not by team — two brackets
// can both "have Spain in the semis" via different paths.
export function diffPicks(mine, theirs, live, topology, precomputed = null) {
  const Dm = precomputed && precomputed.mine ? precomputed.mine : computeState(mine, live, topology);
  const Dt = precomputed && precomputed.theirs ? precomputed.theirs : computeState(theirs, live, topology);
  const PTS = { r32: 1, r16: 2, qf: 4, sf: 8, final: 16 };
  const out = [];
  for (const [mc, dt, a, b, pk] of Dm.R32) {
    if (mc in Dm.RES) continue;                          // decided — already in the score
    const trow = Dt.R32.find(m => m[0] === mc);
    if (trow && pk !== trow[4]) out.push({ code: mc, round: "r32", mine: pk, theirs: trow[4], pts: 1 });
  }
  for (const code in Dm.PICK_BY_CODE) {
    if (code in Dm.RES) continue;
    const mineP = Dm.PICK_BY_CODE[code], theirP = Dt.PICK_BY_CODE[code];
    if (mineP !== theirP)
      out.push({ code, round: Dm.KO_ROUND[code], mine: mineP, theirs: theirP, pts: PTS[Dm.KO_ROUND[code]] });
  }
  out.sort((x, y) => (y.pts - x.pts) || (parseInt(x.code.slice(1), 10) - parseInt(y.code.slice(1), 10)));
  return out;
}

// ── overlay UI ───────────────────────────────────────────────────────────────
const ROUND_TAG = { r32: "R32", r16: "R16", qf: "QF", sf: "SF", final: "Final" };

export function openCompare(topology, live, { onAddLink, onAddDemo, onClose } = {}) {
  const host = document.getElementById("compare");
  const inner = host.querySelector(".bld-inner");
  const prevFocus = document.activeElement;             // a11y: return focus here on close
  host.setAttribute("role", "dialog");
  host.setAttribute("aria-modal", "true");
  host.setAttribute("aria-label", "Pool leaderboard");
  host.hidden = false;
  let openDiff = null;                                   // hash of the row whose diff is expanded
  let modelCache = null;
  const stateCache = new Map();

  function getStateFor(picks) {
    const h = hashPicks(picks);
    const cached = stateCache.get(h);
    if (cached) return cached;
    const D = computeState(picks, live, topology);
    stateCache.set(h, D);
    return D;
  }

  function modelSignature(mine, rivals) {
    const mineSig = mine ? hashPicks(mine) : "";
    const rivalsSig = rivals.map(r => `${hashPicks(r.picks)}:${r.alias || ""}`).join("|");
    return `${mineSig}::${rivalsSig}`;
  }

  function invalidateModel() { modelCache = null; }

  function getModel() {
    const mine = loadPicks();
    const rivals = loadRivals();
    const sig = modelSignature(mine, rivals);
    if (modelCache && modelCache.sig === sig) return modelCache;

    const entries = [];
    if (mine) entries.push({ picks: mine, you: true });
    for (const r of rivals) entries.push({ picks: r.picks, alias: r.alias });
    const rows = standings(entries, live, topology, getStateFor);
    const rivalByHash = new Map();
    for (const r of rivals) rivalByHash.set(hashPicks(r.picks), r);

    modelCache = { sig, mine, rivals, rows, rivalByHash };
    return modelCache;
  }

  function close() {
    host.hidden = true; inner.innerHTML = ""; document.removeEventListener("keydown", onKey);
    if (prevFocus && prevFocus.focus) prevFocus.focus();   // a11y: restore focus to the trigger
    if (onClose) onClose();
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  document.addEventListener("keydown", onKey);

  function render() {
    const { mine, rows, rivalByHash } = getModel();
    const medal = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);

    let body;
    if (!rows.length) {
      body = '<div class="cmp-empty">No brackets yet. Load or build your bracket, then add friends’ share links below.</div>';
    } else {
      body = '<div class="cmp-row cmp-head"><div>#</div><div>Bracket</div><div>Confirmed</div><div>Still live</div><div>Attainable</div><div>Champion</div><div></div></div>' +
        rows.map((r, i) => {
          const champ = `<span class="${r.champAlive ? "" : "cmp-out"}">${esc(r.champ)}</span>${r.champAlive ? "" : " ✕"}`;
          const tools = r.you ? '<span class="cmp-you">you</span>' :
            // "diff" needs a bracket of yours to compare against — hide it until one exists
            (mine ? `<button class="cmp-btn" data-diff="${r.hash}" title="Where you and they differ">diff</button>` : "") +
            `<button class="cmp-btn" data-rename="${r.hash}" title="Rename on your board (local only)">✎</button>` +
            `<button class="cmp-btn" data-remove="${r.hash}" title="Remove from your board">✕</button>`;
          let diffHtml = "";
          if (!r.you && openDiff === r.hash && mine) {
            const rival = rivalByHash.get(r.hash);
            if (!rival) {
              diffHtml = '<div class="cmp-diff"><div class="cmp-dline">That bracket is no longer on your board.</div></div>';
            } else {
              const ds = diffPicks(mine, rival.picks, live, topology, {
                mine: getStateFor(mine),
                theirs: getStateFor(rival.picks),
              });
            diffHtml = '<div class="cmp-diff">' + (ds.length
              ? ds.map(d => `<div class="cmp-dline"><b class="cmp-pts">${d.pts} pt${d.pts > 1 ? "s" : ""}</b>` +
                  `<span class="cmp-code">${esc(d.code)} · ${ROUND_TAG[d.round]}</span>` +
                  `you: <b>${esc(d.mine)}</b> · them: <b>${esc(d.theirs)}</b></div>`).join("")
              : '<div class="cmp-dline">No differences left in the games still to play — it comes down to what’s already banked.</div>') +
              '</div>';
            }
          }
          return `<div class="cmp-row${r.you ? " is-you" : ""}"><div>${medal(i)}</div>` +
            `<div class="cmp-name">${esc(r.name)}</div><div><b>${r.conf}</b></div><div>${r.live}</div>` +
            `<div>${r.attain}</div><div>${champ}</div><div class="cmp-tools">${tools}</div></div>` + diffHtml;
        }).join("");
    }

    inner.innerHTML = `
      <div class="bld-head">
        <div><div class="bld-title">🏆 Pool leaderboard</div>
        <div class="bld-sub">Everyone on this board lives on <b>this device only</b> — nothing is uploaded.</div></div>
        <button class="bld-x" id="cmp-close" title="Close" aria-label="Close leaderboard">✕</button>
      </div>
      <div class="cmp-table">${body}</div>
      <div class="cmp-addbox">
        <div class="cmp-addhead">Add a friend's bracket</div>
        <div class="sp-row"><input id="cmp-link" type="text" placeholder="paste their share link (…#b=…)" autocomplete="off">
        <button id="cmp-add">Add</button></div>
        <div id="cmp-msg" class="cmp-msg"></div>
        <div class="sp-note">Ask them to tap <b>🔗 Share link</b> on their dashboard and send you the link.
        Their bracket is added to your board only — you can rename or remove it anytime.
        ${onAddDemo ? 'No links yet? <button class="linkbtn" id="cmp-demo">Add the demo bracket to try it</button>' : ""}</div>
      </div>`;

    inner.querySelector("#cmp-close").onclick = close;
    inner.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => {
      removeRival(b.dataset.remove);
      if (openDiff === b.dataset.remove) openDiff = null;
      invalidateModel();
      render();
    });
    inner.querySelectorAll("[data-diff]").forEach(b => b.onclick = () => { openDiff = openDiff === b.dataset.diff ? null : b.dataset.diff; render(); });
    inner.querySelectorAll("[data-rename]").forEach(b => b.onclick = () => {
      const row = b.closest(".cmp-row"), nameEl = row.querySelector(".cmp-name");
      nameEl.innerHTML = `<input class="cmp-rename" type="text" maxlength="40" value="${esc(nameEl.textContent)}">`;
      const inp = nameEl.querySelector("input");
      inp.focus(); inp.select();
      const commit = () => { renameRival(b.dataset.rename, inp.value); invalidateModel(); render(); };
      inp.onkeydown = (e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") render(); };
      inp.onblur = commit;
    });
    const linkIn = inner.querySelector("#cmp-link"), msg = inner.querySelector("#cmp-msg");
    inner.querySelector("#cmp-add").onclick = () => {
      const res = onAddLink ? onAddLink(linkIn.value) : { ok: false, reason: "Adding by link isn't wired up." };
      msg.textContent = res.ok ? (res.dup ? "Already on your board." : "Added ✓") : res.reason;
      msg.className = "cmp-msg " + (res.ok ? "ok" : "bad");
      if (res.ok) { linkIn.value = ""; invalidateModel(); render(); }
    };
    linkIn.onkeydown = (e) => { if (e.key === "Enter") inner.querySelector("#cmp-add").click(); };
    const demoBtn = inner.querySelector("#cmp-demo");
    if (demoBtn) demoBtn.onclick = async () => {
      const res = await onAddDemo();
      msg.textContent = res.ok ? (res.dup ? "Already on your board." : "Added the demo ✓") : res.reason;
      msg.className = "cmp-msg " + (res.ok ? "ok" : "bad");
      if (res.ok) { invalidateModel(); render(); }
    };
  }

  render();
  const closeBtn = inner.querySelector("#cmp-close"); if (closeBtn) closeBtn.focus();   // a11y: move focus into the dialog
}
