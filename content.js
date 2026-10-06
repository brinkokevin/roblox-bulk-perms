// ==UserScript==
// @name         API Key Bulk Permissions for Roblox
// @namespace    roblox-bulk-perms
// @version      1.0.1
// @description  Paste a list of Open Cloud scopes and select them all on the Create API Key page.
// @match        https://create.roblox.com/dashboard/*
// @homepageURL  https://github.com/brinkokevin/roblox-bulk-perms
// @downloadURL  https://github.com/brinkokevin/roblox-bulk-perms/releases/latest/download/roblox-bulk-perms.user.js
// @updateURL    https://github.com/brinkokevin/roblox-bulk-perms/releases/latest/download/roblox-bulk-perms.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

// Works as both a Chrome MV3 content script and a userscript (Tampermonkey / Violentmonkey).
// It only clicks the page's own dropdowns. Its one network request is an anonymous read of Roblox's
// public scope list; it stores nothing and never reads, saves or sends the key itself.

(() => {
  "use strict";

  const PANEL_ID = "rbx-bulk-perms";
  const SYSTEM_PLACEHOLDER = "Select API System";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (fn, timeout = 3000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const v = fn();
      if (v) return v;
      await sleep(30);
    }
    return null;
  };

  const combos = () => [...document.querySelectorAll("input[role=combobox]")];
  const systemInput = () => combos().find((i) => i.placeholder === SYSTEM_PLACEHOLDER);
  const listboxOf = (input) => document.getElementById(`${input.id}-listbox`);
  const sections = () => [...document.querySelectorAll("[class*=accessPermissionSubLabel]")];
  const sectionName = (el) => el.innerText.split("\n")[0].trim();
  const opsInputFor = (system) => {
    const section = sections().find((el) => sectionName(el) === system);
    return section && [...section.querySelectorAll("input[role=combobox]")].pop();
  };

  // MUI Autocomplete opens on mousedown and closes on Escape. Only one listbox can be
  // open at a time, so wait for the previous one to unmount before opening the next.
  async function openList(input) {
    await waitFor(() => !document.querySelector("[role=listbox]"), 1500);
    input.focus();
    input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    return waitFor(() => listboxOf(input));
  }

  async function closeList(input) {
    if (listboxOf(input)) input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    input.blur();
    await waitFor(() => !listboxOf(input), 1500);
  }

  async function availableSystems() {
    const input = systemInput();
    const listbox = await openList(input);
    const names = listbox ? [...listbox.querySelectorAll("[role=option]")].map((o) => o.textContent.trim()) : [];
    await closeList(input);
    return names;
  }

  // Scope names don't always start with their API system's name (universe.secret lives under
  // "secret-store", universe.event under "universe-events"), so map them using the dashboard's
  // own public scope catalog. Fetched anonymously: no cookies, nothing about you is sent.
  let scopeCatalog;
  function loadScopeCatalog() {
    scopeCatalog ??= fetch("https://apis.roblox.com/cloud-authentication/v1/scopes", { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => new Map(j.scopeTypes.map((t) => [t.name, t.product])))
      .catch(() => {
        scopeCatalog = undefined;
        return new Map();
      });
    return scopeCatalog;
  }

  // Tokens are separated by newlines, commas or spaces; "#" starts a comment.
  //   *                                  every operation of every API system
  //   universe-datastores                a whole API system (as named in the "Select API System" dropdown)
  //   universe-datastores.objects        every operation of one scope
  //   universe-datastores.objects:read   one operation (exactly what the chips show)
  async function parse(text) {
    const [systems, catalog] = await Promise.all([availableSystems(), loadScopeCatalog()]);
    const wanted = new Map();
    const invalid = [];
    const add = (system, rule) => {
      if (!wanted.has(system)) wanted.set(system, []);
      wanted.get(system).push(rule);
    };
    const tokens = text
      .split("\n")
      .map((line) => line.replace(/#.*/, ""))
      .join(" ")
      .split(/[\s,]+/)
      .filter(Boolean);

    for (const token of tokens) {
      if (token === "*") {
        for (const system of systems) add(system, { scope: null, op: null });
        continue;
      }
      const m = token.match(/^([a-z0-9.-]+?)(?::([a-z0-9-]+|\*))?$/i);
      if (!m) {
        invalid.push(token);
        continue;
      }
      const [, scope, op] = m;
      if (!op && systems.includes(scope)) {
        add(scope, { scope: null, op: null });
        continue;
      }
      const system = catalog.get(scope) ?? (systems.includes(scope) ? scope : scope.split(".")[0]);
      add(system, { scope, op: op && op !== "*" ? op : null });
    }
    return { wanted, invalid };
  }

  async function apply(text, report) {
    report("Reading available permissions…");
    const { wanted, invalid } = await parse(text);
    const problems = invalid.map((t) => `couldn't parse "${t}"`);

    let added = 0;
    let i = 0;
    for (const [system, rules] of wanted) {
      report(`Adding ${system} (${++i}/${wanted.size})…`);

      if (!opsInputFor(system)) {
        const input = systemInput();
        const listbox = await openList(input);
        const option = listbox && [...listbox.querySelectorAll("[role=option]")].find((o) => o.textContent.trim() === system);
        if (!option) {
          await closeList(input);
          problems.push(`no API system "${system}"`);
          continue;
        }
        option.click();
        await closeList(input);
        if (!(await waitFor(() => opsInputFor(system)))) {
          problems.push(`"${system}" section never appeared`);
          continue;
        }
      }

      // The listbox closes after every pick, so reopen it each time until nothing wanted is left.
      const matched = new Set();
      for (let guard = 0; guard < 200; guard++) {
        const input = opsInputFor(system);
        const listbox = await openList(input);
        if (!listbox) break;
        const target = [...listbox.querySelectorAll("[role=option]")].find((o) => {
          // Systems with a single scope list their operations without a scope header.
          const group = o.closest("li:not([role=option])")?.querySelector("[class*=groupLabel]")?.textContent.trim();
          const op = o.textContent.trim();
          const hit = rules.findIndex((r) => (!r.scope || !group || r.scope === group) && (!r.op || r.op === op));
          if (hit !== -1) matched.add(hit);
          return hit !== -1 && o.getAttribute("aria-selected") !== "true";
        });
        if (!target) {
          await closeList(input);
          break;
        }
        target.click();
        added++;
        await closeList(input);
      }
      rules.forEach((r, idx) => {
        if (!matched.has(idx)) problems.push(`no operation matching "${r.scope ?? system}${r.op ? ":" + r.op : ""}"`);
      });
    }

    return { added, problems };
  }

  function currentSelection() {
    return sections()
      .flatMap((el) => [...el.querySelectorAll(".MuiChip-label")].map((c) => c.textContent.trim()))
      .filter((s) => s.includes(":"));
  }

  function buildPanel() {
    const host = document.createElement("div");
    host.id = PANEL_ID;
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host { display: block; margin: 12px 0 16px; }
        .box { border: 1px dashed rgba(255,255,255,.25); border-radius: 8px; padding: 12px; font: 14px/1.4 system-ui, sans-serif; color: #e6e6e6; }
        .title { font-weight: 600; margin-bottom: 6px; }
        .hint { color: #a0a0a0; font-size: 12px; margin-bottom: 8px; }
        code { background: rgba(255,255,255,.08); padding: 0 4px; border-radius: 3px; }
        textarea { width: 100%; box-sizing: border-box; min-height: 90px; resize: vertical; background: #1b1c1e; color: #e6e6e6;
          border: 1px solid rgba(255,255,255,.2); border-radius: 6px; padding: 8px; font: 12px/1.4 ui-monospace, monospace; }
        .row { display: flex; gap: 8px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
        button { font: 600 13px system-ui, sans-serif; border-radius: 6px; padding: 6px 12px; cursor: pointer; border: 1px solid rgba(255,255,255,.25); background: transparent; color: #e6e6e6; }
        button.primary { background: #335fff; border-color: #335fff; color: #fff; }
        button:disabled { opacity: .5; cursor: default; }
        .status { font-size: 12px; color: #a0a0a0; white-space: pre-wrap; }
        .status.err { color: #ff8a80; }
      </style>
      <div class="box">
        <div class="title">Bulk add permissions</div>
        <div class="hint">One per line, or separated by commas/spaces. A system name like <code>memory-stores</code> = all of it,
          a scope like <code>universe.secret</code> = all its operations, <code>universe.secret:read</code> = one operation,
          <code>*</code> = everything.</div>
        <textarea spellcheck="false" placeholder="universe-datastores.objects:read&#10;universe.secret:read&#10;messaging-service"></textarea>
        <div class="row">
          <button class="primary" data-act="apply">Apply</button>
          <button data-act="copy" title="Copy the permissions currently on this key as a pasteable list">Copy current</button>
          <span class="status"></span>
        </div>
      </div>`;

    const textarea = root.querySelector("textarea");
    const status = root.querySelector(".status");
    const applyBtn = root.querySelector("[data-act=apply]");
    const setStatus = (msg, err = false) => {
      status.textContent = msg;
      status.classList.toggle("err", err);
    };

    // Keep the page's own keyboard shortcuts from seeing keystrokes typed here.
    for (const type of ["keydown", "keyup", "keypress"]) textarea.addEventListener(type, (e) => e.stopPropagation());

    applyBtn.addEventListener("click", async () => {
      if (!textarea.value.trim()) return setStatus("Paste some scopes first.", true);
      applyBtn.disabled = true;
      try {
        const { added, problems } = await apply(textarea.value, (msg) => setStatus(msg));
        setStatus(
          `Added ${added} operation${added === 1 ? "" : "s"}.` + (problems.length ? `\n${problems.join("\n")}` : ""),
          problems.length > 0
        );
      } catch (e) {
        setStatus(`Failed: ${e.message}`, true);
      } finally {
        applyBtn.disabled = false;
      }
    });

    root.querySelector("[data-act=copy]").addEventListener("click", async () => {
      const list = currentSelection();
      if (!list.length) return setStatus("No permissions selected yet.", true);
      await navigator.clipboard.writeText(list.join("\n"));
      setStatus(`Copied ${list.length} scope${list.length === 1 ? "" : "s"}.`);
    });

    return host;
  }

  // The dashboard is a single-page app, so watch for the form appearing (and re-appearing).
  function ensurePanel() {
    const input = systemInput();
    if (!input) return;
    const anchor = input.closest("[class*=searchApiContainer]")?.parentElement;
    if (!anchor || anchor.parentElement.querySelector(`#${PANEL_ID}`)) return;
    anchor.before(buildPanel());
  }

  new MutationObserver(ensurePanel).observe(document.body, { childList: true, subtree: true });
  ensurePanel();
})();
