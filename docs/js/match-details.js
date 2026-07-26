import { flagCode } from "./flags.js";

const COMPACT_EVENT_LIMIT = 3;
const MIN_PORTRAIT_FRAME_WIDTH = 720;
const MATCH_HINT_KEY = "wcb.match-details-hint";
const MATCH_HINT_REMINDER_KEY = "wcb.match-details-hint-reminder";
const MATCH_HINT_QUICK_DISMISS_MS = 5000;
const MATCH_HINT_REMINDER_DELAY_MS = 20000;
export const PORTRAIT_HOST = "https://wc26.bogachev.fr";
const PORTRAIT_SLUG = /^[a-z]{3}-[a-z]{3}$/;
const PORTRAIT_STAGE = {
  "Round of 32": "Round of 32",
  "Round of 16": "Round of 16",
  Quarterfinal: "Quarter-final",
  Semifinal: "Semi-final",
  Final: "Final",
};

export function buildPortraitUrl(slug) {
  if (typeof slug !== "string" || !PORTRAIT_SLUG.test(slug)) {
    throw new TypeError("Invalid portrait slug");
  }
  return `${PORTRAIT_HOST}/m/${slug}/`;
}

export function portraitAvailability(code, record, portraitDocument) {
  if (!record || typeof record !== "object") {
    return { status: "mismatch", reason: "local match details are unavailable" };
  }
  if (
    !portraitDocument
    || portraitDocument.version !== 1
    || portraitDocument.host !== PORTRAIT_HOST
    || !portraitDocument.matches
  ) {
    return { status: "missing", reason: "portrait mapping is unavailable" };
  }
  if (portraitDocument.permission !== "approved-for-production") {
    return { status: "permission", reason: "portrait author approval is pending" };
  }
  const mapping = portraitDocument.matches[code];
  if (!mapping) return { status: "missing", reason: "match is not mapped" };

  const localTeams = [record.home, record.away];
  const mappingTeams = mapping.teams;
  const localScore = record.score;
  const sameTeams = Array.isArray(mappingTeams)
    && mappingTeams.length === 2
    && mappingTeams.every(team => localTeams.includes(team))
    && localTeams.every(team => mappingTeams.includes(team));
  const orientedScore = sameTeams && localScore
    ? mappingTeams.map(team => team === record.home ? localScore.home : localScore.away)
    : [];
  const sameScore = Array.isArray(mapping.score)
    && mapping.score.length === 2
    && mapping.score.every((value, index) => value === orientedScore[index]);
  const sameDate = typeof record.kickoff === "string"
    && mapping.date === record.kickoff.slice(0, 10);
  const sameStage = mapping.stage === PORTRAIT_STAGE[record.round];
  if (!sameTeams || !sameScore || !sameDate || !sameStage) {
    return { status: "mismatch", reason: "reviewed portrait identity does not match FIFA facts" };
  }

  try {
    const url = buildPortraitUrl(mapping.slug);
    return {
      status: "available",
      code,
      mapping,
      url,
      title: `${record.home} vs ${record.away} data portrait by Alexander Bogachev`,
    };
  } catch (error) {
    return { status: "mismatch", reason: error.message };
  }
}

export function portraitFrameSpec(availability) {
  if (!availability || availability.status !== "available") {
    throw new TypeError("Portrait is unavailable");
  }
  return {
    src: availability.url,
    title: availability.title,
    referrerPolicy: "no-referrer",
    sandbox: "allow-scripts allow-same-origin",
  };
}

export function formatAttendance(value) {
  return Number.isInteger(value) && value >= 0 ? value.toLocaleString("en-US") : "";
}

export function shouldScheduleMatchHintReminder(elapsed, alreadyReminded) {
  return Number.isFinite(elapsed)
    && elapsed >= 0
    && elapsed < MATCH_HINT_QUICK_DISMISS_MS
    && !alreadyReminded;
}

function eventText(event, type) {
  const kind = type === "goal"
    ? event.kind === "penalty"
      ? " (penalty)"
      : event.kind === "own-goal"
        ? " (own goal)"
        : ""
    : ` (${String(event.card || "").replace("-", " ")})`;
  return `${event.player} ${event.minute}${kind} · ${event.team}`;
}

function eventItems(events, type, compact) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const shown = compact ? events.slice(0, COMPACT_EVENT_LIMIT) : events;
  const items = shown.map(event => eventText(event, type));
  if (compact && events.length > shown.length) {
    items.push(`+${events.length - shown.length} more — open details`);
  }
  return items;
}

export function buildFactModel(record, { compact = true } = {}) {
  if (!record || typeof record !== "object") return null;
  const score = record.score || {};
  if (
    typeof record.home !== "string"
    || typeof record.away !== "string"
    || !Number.isInteger(score.home)
    || !Number.isInteger(score.away)
  ) return null;

  const sections = [];
  const goals = eventItems(record.goals, "goal", compact);
  const cards = eventItems(record.cards, "card", compact);
  if (goals.length) sections.push({ label: "Goals", items: goals });
  if (cards.length) sections.push({ label: "Cards", items: cards });

  const venue = record.venue && typeof record.venue === "object"
    ? [record.venue.stadium, record.venue.city].filter(Boolean).join(" · ")
    : "";
  if (venue) sections.push({ label: "Venue", items: [venue] });

  const attendance = formatAttendance(record.attendance);
  if (attendance) sections.push({ label: "Attendance", items: [attendance] });
  if (typeof record.referee === "string" && record.referee) {
    sections.push({ label: "Referee", items: [record.referee] });
  }
  const provider = typeof record.source?.provider === "string"
    && record.source.provider
    ? record.source.provider
    : "FIFA";
  sections.push({ label: "Source", items: [provider] });

  const meta = [record.round, score.note].filter(
    value => typeof value === "string" && value,
  );
  return {
    title: `${record.home} ${score.home}–${score.away} ${record.away}`,
    meta,
    state: record.state === "partial" ? "Limited match facts" : "",
    sections,
  };
}

function appendText(parent, tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

function expansionIcon(collapsed) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const paths = collapsed
    ? [
        ["polyline", "4,14 10,14 10,20"],
        ["polyline", "20,10 14,10 14,4"],
        ["line", "14,10 21,3"],
        ["line", "3,21 10,14"],
      ]
    : [
        ["polyline", "15,3 21,3 21,9"],
        ["polyline", "9,21 3,21 3,15"],
        ["line", "21,3 14,10"],
        ["line", "3,21 10,14"],
      ];
  for (const [tag, points] of paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (tag === "line") {
      const [start, end] = points.split(" ");
      const [x1, y1] = start.split(",");
      const [x2, y2] = end.split(",");
      path.setAttribute("x1", x1);
      path.setAttribute("y1", y1);
      path.setAttribute("x2", x2);
      path.setAttribute("y2", y2);
    } else {
      path.setAttribute("points", points);
    }
    svg.append(path);
  }
  return svg;
}

function setExpansionButton(button, expanded) {
  if (!button) return;
  const label = expanded ? "Collapse data portrait" : "Expand data portrait";
  button.replaceChildren(expansionIcon(expanded));
  button.setAttribute("aria-label", label);
  button.title = label;
}

function socialCreditLink({ href, label, pathData }) {
  const link = document.createElement("a");
  link.className = "portrait-credit-social";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.referrerPolicy = "no-referrer";
  link.setAttribute("aria-label", label);
  link.title = label;
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  icon.append(path);
  link.append(icon);
  return link;
}

function creditSeparator() {
  const separator = document.createElement("span");
  separator.className = "portrait-credit-separator";
  separator.setAttribute("aria-hidden", "true");
  separator.textContent = "\u00b7";
  return separator;
}

function creditLink(href, text, label = text) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.referrerPolicy = "no-referrer";
  link.textContent = text;
  link.setAttribute("aria-label", label);
  return link;
}

function appendDialogScoreTitle(host, model, record, headingTag) {
  const heading = document.createElement(headingTag);
  heading.className = "mdlg-title mdlg-score-title";
  heading.setAttribute("aria-label", model.title);
  const appendTeam = (team, side) => {
    const teamNode = document.createElement("span");
    teamNode.className = `mdlg-score-team mdlg-score-${side}`;
    const code = flagCode(team);
    if (code) {
      const flag = document.createElement("img");
      flag.className = "mdlg-score-flag";
      flag.src = `flags/${code}.svg`;
      flag.alt = "";
      flag.width = 32;
      flag.height = 22;
      flag.loading = "eager";
      flag.decoding = "async";
      teamNode.append(flag);
    }
    appendText(teamNode, "span", "mdlg-score-name", team);
    return teamNode;
  };
  heading.append(
    appendTeam(record.home, "home"),
    appendText(document.createDocumentFragment(), "span", "mdlg-score-number", String(record.score.home)),
    appendText(document.createDocumentFragment(), "span", "mdlg-score-separator", "\u2013"),
    appendText(document.createDocumentFragment(), "span", "mdlg-score-number", String(record.score.away)),
    appendTeam(record.away, "away"),
  );
  host.append(heading);
}

function renderModel(host, model, prefix, headingTag = "h4", record = null) {
  host.replaceChildren();
  if (prefix === "mdlg" && record) {
    appendDialogScoreTitle(host, model, record, headingTag);
  } else {
    appendText(host, headingTag, `${prefix}-title`, model.title);
  }
  if (model.meta.length) {
    appendText(host, "p", `${prefix}-meta`, model.meta.join(" · "));
  }
  if (model.state) {
    appendText(host, "p", `${prefix}-state`, model.state);
  }
  const sections = document.createElement("div");
  sections.className = `${prefix}-sections`;
  for (const section of model.sections) {
    const row = document.createElement("section");
    row.className = `${prefix}-section`;
    appendText(row, "h5", `${prefix}-label`, section.label);
    const values = document.createElement("div");
    values.className = `${prefix}-values`;
    for (const item of section.items) {
      appendText(values, "p", `${prefix}-value`, item);
    }
    row.append(values);
    sections.append(row);
  }
  host.append(sections);
}

function activeActualCard(target) {
  const card = target instanceof Element
    ? target.closest('.mcard[data-played="true"], .match[data-played="true"]')
    : null;
  if (!card || !card.closest(".bracket.mode-actual")) return null;
  const wrap = card.closest(".brk-wrap");
  if (!wrap || wrap.getAttribute("data-view") !== "actual" || card.clientWidth === 0) {
    return null;
  }
  return card;
}

function hoverActualCard(target) {
  const card = activeActualCard(target);
  if (!card || target.closest(".team[data-team]")) return null;
  return card;
}

function matchRecord(detailsState, card) {
  const matches = detailsState.ok && detailsState.data
    ? detailsState.data.matches
    : null;
  return matches && matches[card.dataset.matchCode] || null;
}

function isInteractiveDescendant(target, card) {
  const interactive = target.closest(
    "a,button,input,select,textarea,[contenteditable],[role='button']",
  );
  if (isMatchDetailControl(interactive, card)) return false;
  return interactive && interactive !== card;
}

function isMatchDetailControl(target, card) {
  return Boolean(
    target
    && target.matches?.(".mhead[role='button'],.mlabel[role='button']")
    && target.closest('.mcard[data-played="true"],.match[data-played="true"]') === card
  );
}

export function initMatchDetails(root, detailsState, portraitState) {
  const factcard = document.getElementById("factcard");
  const dialog = document.getElementById("matchdlg");
  const dialogContent = document.getElementById("matchdlg-content");
  const dialogClose = document.getElementById("matchdlg-close");
  const dialogPortrait = dialog && dialog.querySelector(".mdlg-portrait");
  const dialogPortraitNote = dialog && dialog.querySelector(".mdlg-portrait-note");
  const portraitExpand = document.getElementById("portrait-expand");
  const disclosure = document.getElementById("portrait-disclosure");
  let guidance = null;
  let guidanceSetOpen = null;
  if (!root || !factcard) return () => {};

  const controller = new AbortController();
  const { signal } = controller;
  let hoverTimer = 0;
  let portraitTimer = 0;
  let hideTimer = 0;
  let guidanceReminderTimer = 0;
  let currentCard = null;
  let currentPortrait = null;
  let portraitFrame = null;
  let portraitFramePinned = false;
  let originCard = null;
  let closeFocusTarget = null;
  let lastPointer = null;
  let touchOpenedAt = 0;
  let layoutFrame = 0;
  const warnedPortraits = new Set();

  function rememberGuidance(key) {
    try {
      localStorage.setItem(key, "1");
    } catch (error) {
      void error;
    }
  }

  function hasRememberedGuidance(key) {
    try {
      return localStorage.getItem(key) === "1";
    } catch (error) {
      void error;
      return false;
    }
  }

  function markGuidanceUsed() {
    clearTimeout(guidanceReminderTimer);
    guidanceReminderTimer = 0;
    rememberGuidance(MATCH_HINT_KEY);
    rememberGuidance(MATCH_HINT_REMINDER_KEY);
    if (!guidance) return;
    guidance.classList.remove("first-run", "reminder");
    guidanceSetOpen?.(false);
  }

  function clearTimers() {
    clearTimeout(hoverTimer);
    clearTimeout(portraitTimer);
    clearTimeout(hideTimer);
    hoverTimer = 0;
    portraitTimer = 0;
    hideTimer = 0;
  }

  function removePortraitFrame() {
    if (portraitFrame) portraitFrame.remove();
    portraitFrame = null;
    portraitFramePinned = false;
    factcard.classList.remove("portrait-loaded");
  }

  function hideFactCard({ preserveFrame = false } = {}) {
    clearTimers();
    if (!preserveFrame && !portraitFramePinned) removePortraitFrame();
    currentCard = null;
    currentPortrait = null;
    factcard.classList.remove("show");
    factcard.setAttribute("aria-hidden", "true");
    if (!preserveFrame) factcard.replaceChildren();
  }

  function positionFactCard(card) {
    const pad = 14;
    const gap = 12;
    const rect = card.getBoundingClientRect();
    const width = factcard.offsetWidth;
    const height = factcard.offsetHeight;
    let left = rect.right + gap;
    if (left + width > window.innerWidth - pad) left = rect.left - width - gap;
    if (left < pad) left = Math.max(pad, window.innerWidth - width - pad);
    let top = lastPointer
      ? lastPointer.clientY - Math.min(24, height / 4)
      : rect.top;
    top = Math.max(pad, Math.min(top, window.innerHeight - height - pad));
    factcard.style.left = `${Math.round(left)}px`;
    factcard.style.top = `${Math.round(top)}px`;
  }

  function suppressTeamCard() {
    const statcard = document.getElementById("statcard");
    if (statcard) statcard.classList.remove("show");
  }

  function availabilityFor(card, record) {
    const availability = portraitAvailability(
      card.dataset.matchCode,
      record,
      portraitState.ok ? portraitState.data : null,
    );
    if (
      availability.status === "mismatch"
      && !warnedPortraits.has(card.dataset.matchCode)
    ) {
      warnedPortraits.add(card.dataset.matchCode);
      console.warn(
        `Portrait mapping rejected for ${card.dataset.matchCode}: ${availability.reason}`,
      );
    }
    return availability;
  }

  function directLink(availability, className) {
    const link = document.createElement("a");
    link.className = className;
    link.href = availability.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.referrerPolicy = "no-referrer";
    link.textContent = "Open portrait directly";
    return link;
  }

  function renderFactPortrait(availability) {
    const expand = document.createElement("button");
    expand.type = "button";
    expand.className = "fc-details-expand";
    expand.dataset.matchExpand = "true";
    expand.replaceChildren(expansionIcon(false));
    expand.setAttribute("aria-label", "Expand match details");
    expand.title = "Expand match details";
    if (availability.status !== "available") {
      const actions = document.createElement("div");
      actions.className = "fc-portrait-actions fc-details-actions";
      actions.append(expand);
      factcard.append(actions);
      return;
    }
    const portrait = document.createElement("section");
    portrait.className = "fc-portrait";
    appendText(
      portrait,
      "p",
      "fc-portrait-status",
      "External portrait available",
    );
    const actions = document.createElement("div");
    actions.className = "fc-portrait-actions";
    actions.append(directLink(availability, "fc-portrait-link"));
    actions.append(expand);
    const preview = document.createElement("div");
    preview.className = "portrait-preview";
    preview.dataset.portraitPreview = availability.code;
    portrait.append(actions, preview);
    factcard.append(portrait);
  }

  function createPortraitFrame(container, availability, pinned) {
    if (
      availability.status !== "available"
      || !container
      || !portraitEmbedFits()
    ) return null;
    if (
      portraitFrame
      && portraitFrame.dataset.portraitCode !== availability.code
    ) {
      removePortraitFrame();
    }
    if (!portraitFrame) {
      const spec = portraitFrameSpec(availability);
      portraitFrame = document.createElement("iframe");
      portraitFrame.className = "portrait-frame";
      portraitFrame.src = spec.src;
      portraitFrame.title = spec.title;
      portraitFrame.referrerPolicy = spec.referrerPolicy;
      portraitFrame.setAttribute("sandbox", spec.sandbox);
      portraitFrame.dataset.portraitCode = availability.code;
    }
    portraitFramePinned = pinned;
    container.hidden = false;
    if (portraitFrame.parentElement !== container) {
      container.replaceChildren();
      if (portraitFrame.isConnected && typeof container.moveBefore === "function") {
        container.moveBefore(portraitFrame, null);
      } else {
        container.append(portraitFrame);
      }
    }
    if (container.classList.contains("portrait-preview")) {
      factcard.classList.add("portrait-loaded");
    }
    sizePortraitFrame(container);
    return portraitFrame;
  }

  function sizePortraitFrame(container) {
    if (!portraitFrame || !container) return;
    const availableWidth = container.clientWidth;
    if (!availableWidth) return;
    const mode = availableWidth < MIN_PORTRAIT_FRAME_WIDTH ? "scaled" : "native";
    const cachedWidth = Number(container.dataset.portraitWidth || 0);
    const cachedMode = container.dataset.portraitMode || "";
    if (cachedMode === mode && Math.abs(cachedWidth - availableWidth) < 1) return;
    container.dataset.portraitWidth = String(availableWidth);
    container.dataset.portraitMode = mode;
    if (availableWidth < MIN_PORTRAIT_FRAME_WIDTH) {
      const scale = availableWidth / MIN_PORTRAIT_FRAME_WIDTH;
      portraitFrame.style.width = `${MIN_PORTRAIT_FRAME_WIDTH}px`;
      portraitFrame.style.height = `${MIN_PORTRAIT_FRAME_WIDTH * 9 / 16}px`;
      portraitFrame.style.transform = `scale(${scale})`;
      portraitFrame.style.transformOrigin = "top left";
      container.style.aspectRatio = "auto";
      container.style.height = `${MIN_PORTRAIT_FRAME_WIDTH * 9 / 16 * scale}px`;
      return;
    }
    portraitFrame.style.width = "";
    portraitFrame.style.height = "";
    portraitFrame.style.transform = "";
    portraitFrame.style.transformOrigin = "";
    container.style.aspectRatio = "";
    container.style.height = "";
  }

  function portraitEmbedFits() {
    return window.innerWidth >= 560 && window.innerHeight >= 500;
  }

  function scheduleGeometryRefresh() {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      if (portraitFrame) sizePortraitFrame(portraitFrame.parentElement);
      if (currentCard && factcard.classList.contains("show")) positionFactCard(currentCard);
    });
  }

  function loadHoverPortrait(card, availability) {
    if (
      currentCard !== card
      || availability.status !== "available"
      || !factcard.classList.contains("show")
    ) return;
    const preview = factcard.querySelector(
      `[data-portrait-preview="${availability.code}"]`,
    );
    createPortraitFrame(preview, availability, false);
    positionFactCard(card);
  }

  function setPortraitExpanded(expanded) {
    if (!dialog) return;
    const active = Boolean(expanded && portraitFrame && portraitFramePinned);
    dialog.classList.toggle("portrait-expanded", active);
    if (portraitExpand) {
      portraitExpand.hidden = !portraitFramePinned;
      portraitExpand.setAttribute("aria-expanded", active ? "true" : "false");
      setExpansionButton(portraitExpand, active);
    }
  }

  function clearDialogPortrait({ preserveFrame = false } = {}) {
    if (!preserveFrame) removePortraitFrame();
    setPortraitExpanded(false);
    if (dialogPortrait) {
      dialogPortrait.hidden = true;
      dialogPortrait.replaceChildren();
    }
    if (dialogPortraitNote) {
      dialogPortraitNote.hidden = true;
      dialogPortraitNote.replaceChildren();
    }
    if (portraitExpand) portraitExpand.hidden = true;
  }

  function renderDialogPortrait(availability, expanded) {
    const reuseFrame = Boolean(
      portraitFrame
      && availability.status === "available"
      && portraitFrame.dataset.portraitCode === availability.code,
    );
    clearDialogPortrait({ preserveFrame: reuseFrame });
    if (!dialogPortrait || !dialogPortraitNote) return;
    if (
      availability.status === "missing"
      || availability.status === "permission"
    ) return;
    if (availability.status === "mismatch") {
      dialogPortraitNote.hidden = false;
      dialogPortraitNote.textContent = "The external portrait is unavailable because its reviewed identity no longer matches this FIFA result.";
      return;
    }
    if (!portraitEmbedFits()) {
      dialogPortraitNote.hidden = false;
      dialogPortraitNote.append(
        document.createTextNode(
          "This portrait needs a wider viewing area to keep its controls usable. ",
        ),
        directLink(availability, "mdlg-portrait-link"),
      );
      return;
    }
    dialogPortraitNote.hidden = false;
    dialogPortraitNote.append(
      document.createTextNode(
        "External visual by Alexander Bogachev. It loads from wc26.bogachev.fr and may run analytics. ",
      ),
      directLink(availability, "mdlg-portrait-link"),
    );
    createPortraitFrame(dialogPortrait, availability, true);
    setPortraitExpanded(expanded);
  }

  function syncDisclosure() {
    if (!disclosure) return;
    const mappings = portraitState.ok
      && portraitState.data
      && portraitState.data.matches;
    const actual = root.querySelector(".brk-wrap")?.dataset.view === "actual";
    disclosure.hidden = !(mappings && Object.keys(mappings).length && actual);
  }

  function syncGuidance() {
    if (!guidance) return;
    guidance.hidden = root.querySelector(".brk-wrap")?.dataset.view !== "actual";
  }

  function renderGuidance() {
    if (!detailsState.ok) return;
    const table = root.querySelector(".brk-wrap");
    if (!table) return;
    guidance = document.createElement("div");
    guidance.className = "match-details-help";
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "How to open match facts");
    button.setAttribute("aria-controls", "match-details-coach");
    button.textContent = "i";
    const coach = document.createElement("div");
    coach.id = "match-details-coach";
    coach.className = "match-details-coach";
    coach.setAttribute("role", "dialog");
    coach.setAttribute("aria-label", "How to explore match details");
    coach.setAttribute("aria-live", "polite");
    coach.setAttribute("aria-atomic", "true");
    const coachIcon = appendText(
      coach,
      "span",
      "match-details-coach-icon",
      "i",
    );
    coachIcon.setAttribute("aria-hidden", "true");
    const title = appendText(
      coach,
      "strong",
      "match-details-coach-title",
      "Match details",
    );
    const copy = appendText(
      coach,
      "p",
      "match-details-coach-copy",
      "Click or hover a match header like M97 for details.",
    );
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "match-details-coach-dismiss";
    dismiss.textContent = "Got it";
    coach.append(dismiss);
    const setCoachCopy = reminder => {
      title.textContent = reminder ? "Quick reminder" : "Match details";
      copy.textContent = reminder
        ? "Try M97: click or hover its header for details."
        : "Click or hover a match header like M97 for details.";
      dismiss.textContent = reminder ? "Understood" : "Got it";
      guidance.classList.toggle("reminder", reminder);
    };
    const setOpen = open => {
      guidance.classList.toggle("open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    };
    guidanceSetOpen = setOpen;
    let firstShownAt = 0;
    const showReminder = () => {
      guidanceReminderTimer = 0;
      if (
        !guidance
        || guidance.hidden
        || currentCard
        || (dialog && dialog.open)
      ) return;
      setCoachCopy(true);
      guidance.classList.remove("first-run");
      setOpen(true);
      rememberGuidance(MATCH_HINT_REMINDER_KEY);
    };
    const dismissGuidance = ({ returnFocus = false } = {}) => {
      const quickDismiss = guidance.classList.contains("first-run")
        && shouldScheduleMatchHintReminder(
          performance.now() - firstShownAt,
          hasRememberedGuidance(MATCH_HINT_REMINDER_KEY),
        );
      setOpen(false);
      guidance.classList.remove("first-run");
      rememberGuidance(MATCH_HINT_KEY);
      if (quickDismiss) {
        clearTimeout(guidanceReminderTimer);
        guidanceReminderTimer = setTimeout(
          showReminder,
          MATCH_HINT_REMINDER_DELAY_MS,
        );
      }
      if (returnFocus) button.focus();
    };
    button.addEventListener("click", () => {
      if (guidance.classList.contains("open")) {
        dismissGuidance();
        return;
      }
      setCoachCopy(false);
      setOpen(true);
    }, { signal });
    dismiss.addEventListener("click", () => {
      dismissGuidance({ returnFocus: true });
    }, { signal });
    const seen = hasRememberedGuidance(MATCH_HINT_KEY);
    if (!seen) {
      guidance.classList.add("open", "first-run");
      button.setAttribute("aria-expanded", "true");
      firstShownAt = performance.now();
    }
    guidance.dismiss = dismissGuidance;
    guidance.append(button, coach);
    table.append(guidance);
    syncGuidance();
  }

  function renderDisclosure() {
    if (!disclosure) return;
    disclosure.replaceChildren();
    if (!detailsState.ok || !portraitState.ok || !portraitState.data?.matches) {
      disclosure.hidden = true;
      return;
    }
    const identity = document.createElement("div");
    identity.className = "portrait-credit-group portrait-credit-identity";
    appendText(identity, "strong", "portrait-credit-name", "Eric Lam");
    identity.append(
      socialCreditLink({
        href: "https://github.com/eriic-builds",
        label: "eriic-builds on GitHub",
        pathData: "M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z",
      }),
      socialCreditLink({
        href: "https://www.linkedin.com/in/ericxlam/",
        label: "Eric Lam on LinkedIn",
        pathData: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z",
      }),
    );
    const sources = document.createElement("div");
    sources.className = "portrait-credit-group portrait-credit-sources";
    sources.append(
      creditLink(
        "https://github.com/eriic-builds/mywcbracket",
        "mywcbracket",
        "SLED bracket project on GitHub",
      ),
      creditSeparator(),
    );
    const data = document.createElement("span");
    appendText(data, "strong", "portrait-credit-key", "Data:");
    data.append(
      document.createTextNode(" "),
      creditLink("https://www.fifa.com/", "FIFA", "FIFA data source"),
    );
    sources.append(data, creditSeparator());
    const portraits = document.createElement("span");
    appendText(portraits, "strong", "portrait-credit-key", "Portraits:");
    portraits.append(
      document.createTextNode(" "),
      creditLink(
        PORTRAIT_HOST,
        "Alexander Bogachev",
        "Data portraits by Alexander Bogachev",
      ),
    );
    sources.append(portraits);
    disclosure.append(identity, sources);
    syncDisclosure();
  }

  function showFactCard(card, { keepPortraitTimer = false } = {}) {
    if (dialog && dialog.open) return;
    const record = matchRecord(detailsState, card);
    const model = buildFactModel(record, { compact: true });
    if (!model) return;
    clearTimeout(hoverTimer);
    clearTimeout(hideTimer);
    hoverTimer = 0;
    hideTimer = 0;
    if (!keepPortraitTimer) {
      clearTimeout(portraitTimer);
      portraitTimer = 0;
    }
    if (!portraitFramePinned) removePortraitFrame();
    currentCard = card;
    currentPortrait = availabilityFor(card, record);
    suppressTeamCard();
    renderModel(factcard, model, "fc");
    renderFactPortrait(currentPortrait);
    factcard.setAttribute("aria-hidden", "false");
    factcard.classList.add("show");
    positionFactCard(card);
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideFactCard, portraitFrame && !portraitFramePinned ? 220 : 60);
  }

  function finishDialogClose() {
    clearDialogPortrait();
    const target = closeFocusTarget || originCard;
    closeFocusTarget = null;
    originCard = null;
    if (target && document.contains(target)) {
      requestAnimationFrame(() => target.focus());
    }
  }

  function closeDialog(focusTarget = null) {
    if (!dialog || !dialog.open || typeof dialog.close !== "function") return;
    closeFocusTarget = focusTarget;
    dialog.close();
    finishDialogClose();
  }

  function openMatchDialog(record, card, { expanded = false } = {}) {
    if (
      !dialog
      || !dialogContent
      || typeof dialog.showModal !== "function"
      || dialog.open
    ) return;
    const model = buildFactModel(record, { compact: false });
    if (!model) return;
    const availability = availabilityFor(card, record);
    const preserveFrame = Boolean(
      portraitFrame
      && availability.status === "available"
      && portraitFrame.dataset.portraitCode === availability.code,
    );
    hideFactCard({ preserveFrame });
    originCard = card;
    renderModel(dialogContent, model, "mdlg", "h4", record);
    dialog.showModal();
    renderDialogPortrait(availability, expanded);
    requestAnimationFrame(() => dialogClose && dialogClose.focus());
  }

  renderGuidance();
  renderDisclosure();

  if (!detailsState.ok) {
    const controls = root.querySelector(".brk-controls");
    if (controls) {
      const notice = document.createElement("p");
      notice.className = "details-degraded";
      notice.setAttribute("role", "status");
      notice.textContent = "Match facts are unavailable right now — scores and picks still work.";
      controls.insertAdjacentElement("afterend", notice);
    }
  } else {
    root.addEventListener("pointerover", event => {
      if (event.pointerType === "touch") return;
      const card = hoverActualCard(event.target);
      if (!card || hoverActualCard(event.relatedTarget) === card) return;
      markGuidanceUsed();
      lastPointer = event;
      suppressTeamCard();
      clearTimeout(hoverTimer);
      clearTimeout(portraitTimer);
      const record = matchRecord(detailsState, card);
      const availability = record
        ? availabilityFor(card, record)
        : { status: "missing" };
      hoverTimer = setTimeout(
        () => showFactCard(card, { keepPortraitTimer: true }),
        150,
      );
      if (
        availability.status === "available"
        && window.matchMedia("(pointer: fine)").matches
        && portraitEmbedFits()
      ) {
        portraitTimer = setTimeout(
          () => loadHoverPortrait(card, availability),
          500,
        );
      }
    }, { signal });

    root.addEventListener("pointermove", event => {
      const card = hoverActualCard(event.target);
      if (!card) return;
      lastPointer = event;
      suppressTeamCard();
    }, { signal });

    root.addEventListener("pointerout", event => {
      const card = hoverActualCard(event.target);
      if (!card || hoverActualCard(event.relatedTarget) === card) return;
      if (factcard.contains(event.relatedTarget)) return;
      clearTimeout(hoverTimer);
      clearTimeout(portraitTimer);
      hoverTimer = 0;
      portraitTimer = 0;
      if (
        event.relatedTarget instanceof Element
        && event.relatedTarget.closest(".team[data-team]")
      ) {
        hideFactCard();
        return;
      }
      if (card === currentCard || hoverTimer) scheduleHide();
    }, { signal });

    root.addEventListener("focusin", event => {
      const card = activeActualCard(event.target);
      if (card && isMatchDetailControl(event.target, card)) {
        markGuidanceUsed();
        showFactCard(card);
      }
    }, { signal });

    root.addEventListener("focusout", event => {
      const card = activeActualCard(event.target);
      if (!card || card.contains(event.relatedTarget) || factcard.contains(event.relatedTarget)) {
        return;
      }
      scheduleHide();
    }, { signal });

    root.addEventListener("click", event => {
      const viewButton = event.target.closest(".brk-toggle button");
      if (viewButton) {
        hideFactCard();
        if (viewButton.dataset.view !== "actual") closeDialog(viewButton);
        syncDisclosure();
        syncGuidance();
        return;
      }
      const collapse = event.target.closest(".sec-toggle");
      if (collapse && collapse.getAttribute("aria-controls") === "sec-bracket-body") {
        hideFactCard();
        closeDialog(collapse);
        return;
      }
      const card = activeActualCard(event.target);
      if (!card || isInteractiveDescendant(event.target, card)) return;
      markGuidanceUsed();
      if (dialog && dialog.open && Date.now() - touchOpenedAt < 700) return;
      const record = matchRecord(detailsState, card);
      if (record) openMatchDialog(record, card);
    }, { signal });

    root.addEventListener("pointerup", event => {
      if (event.pointerType !== "touch") return;
      const card = activeActualCard(event.target);
      if (!card || isInteractiveDescendant(event.target, card)) return;
      markGuidanceUsed();
      const record = matchRecord(detailsState, card);
      if (!record) return;
      touchOpenedAt = Date.now();
      openMatchDialog(record, card);
    }, { signal });

    root.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = activeActualCard(event.target);
      if (!card || !isMatchDetailControl(event.target, card)) return;
      markGuidanceUsed();
      event.preventDefault();
      const record = matchRecord(detailsState, card);
      if (record) openMatchDialog(record, card);
    }, { signal });
  }

  factcard.addEventListener("pointerenter", () => clearTimeout(hideTimer), { signal });
  factcard.addEventListener("pointerleave", event => {
    if (currentCard && currentCard.contains(event.relatedTarget)) return;
    scheduleHide();
  }, { signal });
  factcard.addEventListener("click", event => {
    const expand = event.target.closest("[data-match-expand]");
    if (!expand || !currentCard) return;
    const record = matchRecord(detailsState, currentCard);
    if (record) openMatchDialog(record, currentCard);
  }, { signal });
  window.addEventListener("resize", () => {
    scheduleGeometryRefresh();
  }, { signal });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && dialog?.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (dialog.classList.contains("portrait-expanded")) {
        setPortraitExpanded(false);
        portraitExpand?.focus();
      } else {
        closeDialog();
      }
      return;
    }
    if (event.key === "Escape" && guidance?.classList.contains("open")) {
      guidance.dismiss?.();
    }
    if (event.key === "Escape" && factcard.classList.contains("show")) {
      hideFactCard();
    }
  }, { signal, capture: true });

  if (dialogClose) {
    dialogClose.addEventListener("click", () => closeDialog(), { signal });
  }
  if (portraitExpand) {
    portraitExpand.addEventListener("click", () => {
      setPortraitExpanded(!dialog.classList.contains("portrait-expanded"));
    }, { signal });
  }
  if (dialog) {
    dialog.addEventListener("close", finishDialogClose, { signal });
  }

  return () => {
    controller.abort();
    if (layoutFrame) {
      cancelAnimationFrame(layoutFrame);
      layoutFrame = 0;
    }
    clearTimeout(guidanceReminderTimer);
    hideFactCard();
    closeDialog();
    clearDialogPortrait();
    root.querySelectorAll(".details-degraded").forEach(node => node.remove());
    if (disclosure) {
      disclosure.hidden = true;
      disclosure.replaceChildren();
    }
    if (guidance) guidance.remove();
    if (dialogContent) dialogContent.replaceChildren();
  };
}
