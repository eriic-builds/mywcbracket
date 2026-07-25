// share.js — encode a picks object into a URL-safe string and back. Pure module:
// no DOM, no storage, no network. A bracket is 31 binary choices, so it travels as a
// bitstring inside the URL *fragment* — which browsers never send to any server.
// Wire format (dev-docs/[01]-zero-backend-social-loop/BRIEF.md):
// #b=<base64url(UTF-8 JSON {v:1, b:"31x 0|1", n:name, t:int})>
import { deriveStructure, teamsFor, buildPicks } from "./builder.js";

const b64url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

// Canonical code order. Later rounds' teams depend on earlier picks, so both encode
// and decode must walk this order while building up the same `sel` map.
function codeOrder(S) {
  return [...S.r32codes, ...S.r16codes, ...S.qfcodes, ...S.sfcodes, S.finalcode];
}

export function encodeShare(picks, topology) {
  const S = deriveStructure(topology);
  const sel = {};
  picks.r32.forEach(m => { sel[m[0]] = m[4]; });
  S.r16codes.forEach((c, j) => { sel[c] = picks.r16_win[j]; });
  S.qfcodes.forEach((c, j) => { sel[c] = picks.qf_win[j]; });
  S.sfcodes.forEach((c, j) => { sel[c] = picks.sf_win[j]; });
  sel[S.finalcode] = picks.champ;
  let bits = "";
  for (const c of codeOrder(S)) {
    const [a, b] = teamsFor(S, c, sel);
    if (sel[c] !== a && sel[c] !== b) throw new Error("bracket is inconsistent at " + c);
    bits += sel[c] === a ? "0" : "1";
  }
  const payload = { v: 1, b: bits, n: String(picks.entrant || ""), t: picks.tiebreaker | 0 };
  return b64url(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeShare(str, topology) {
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(unb64url(str)));
  } catch (e) {
    throw new Error("the link is truncated or garbled");
  }
  if (payload.v !== 1) throw new Error("this link was made by a newer version of the site");
  if (typeof payload.b !== "string" || !/^[01]{31}$/.test(payload.b))
    throw new Error("the link doesn't contain a complete bracket");
  const S = deriveStructure(topology);
  const sel = {};
  codeOrder(S).forEach((c, i) => {
    const [a, b] = teamsFor(S, c, sel);
    sel[c] = payload.b[i] === "0" ? a : b;
  });
  // Name is attacker-controllable input: cap it. (It is esc()'d wherever rendered.)
  const name = String(payload.n || "shared bracket").slice(0, 40);
  return buildPicks(topology, sel, name, payload.t);
}
