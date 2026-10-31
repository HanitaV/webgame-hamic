/** Sổ tay (GDD 5.3, 10.4) and Thành tựu (GDD 7). */

import { rich, setRich } from "../rich";
import { DATA } from "../../core/data";
import { t } from "../../core/i18n";
import { P, achievementProgress, coreFactsOpen } from "../../game/progress";
import { blockIcon, btn, el } from "../dom";
import { back } from "../router";

export function screenNotebook(root: HTMLElement) {
  const tabs = el("div", { class: "tabs", role: "tablist" });
  const body = el("div", { class: "book-body" });
  const open = coreFactsOpen();
  const casualFirst = P.get().casualLit.length > 0 && P.get().lit.length === 0;

  const showCore = () => {
    body.replaceChildren();
    const grid = el("div", { class: "fact-grid" });
    for (const f of DATA.facts) {
      const c = DATA.circuits.find((x) => x.id === f.circuit);
      const on = open.has(f.circuit);
      const card = el("article", { class: `fact panel${on ? "" : " locked"}` },
        el("div", { class: "fact-head" }, blockIcon(c?.color ?? "#fff", on, 24), el("b", { text: on ? f.title : t("book.locked", { n: f.circuit }) })));
      if (on) {
        card.append(rich(casualFirst ? f.casual : f.text));
        if (f.divisors) {
          const row = el("div", { class: "divisors", "aria-label": t("book.divisors") });
          for (const d of f.divisors) row.append(el("span", { class: "slot div", text: String(d) }));
          row.append(el("span", { class: "div-sum", text: `= ${f.divisors.reduce((a, b) => a + b, 0)} ≠ 70` }));
          card.append(row);
        }
        card.append(el("small", { class: "muted", text: t("book.source", { s: f.source }) }));
      }
      grid.append(card);
    }
    body.append(grid);
  };
  const showN = () => {
    body.replaceChildren();
    const have = new Set(P.get().factsN);
    const detail = el("p", { class: "fact-n-detail panel", text: t("book.pickN") });
    const grid = el("div", { class: "n-grid", role: "grid" });
    for (const f of DATA.factsN) {
      const on = have.has(f.n);
      const b = el("button", { type: "button", class: `slot n-cell${on ? " on" : ""}${f.tags.includes("weird") ? " weird" : ""}`, disabled: !on, text: String(f.n), "aria-label": on ? `${f.n}` : t("book.lockedN", { n: f.n }) });
      b.addEventListener("click", () => setRich(detail, f.text));
      grid.append(b);
    }
    body.append(el("p", { class: "muted", text: t("book.nCount", { n: have.size, max: DATA.factsN.length }) }), detail, grid);
  };
  const tab = (id: string, label: string, fn: () => void) => {
    const b = btn(label, () => { tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", String(x === b))); fn(); }, "small tab", { role: "tab" });
    tabs.append(b);
    return b;
  };
  const first = tab("core", t("book.core", { n: open.size }), showCore);
  tab("n", t("book.n"), showN);
  root.append(el("div", { class: "screen book-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("title.notebook") }), tabs),
    el("div", { class: "panel dark scroll-panel" }, body)));
  first.setAttribute("aria-selected", "true");
  showCore();
}

export function screenAchievements(root: HTMLElement) {
  const list = el("ul", { class: "ach-list" });
  let got = 0;
  for (const a of DATA.achievements) {
    const pr = achievementProgress(a);
    if (pr.done) got += 1;
    const secret = a.hidden && !pr.done;
    const li = el("li", { class: `ach panel${pr.done ? " done" : ""}` },
      el("span", { class: `ach-icon${pr.done ? " on" : ""}`, "aria-hidden": "true" }),
      el("div", { class: "ach-text" },
        el("b", { text: secret ? t("ach.hidden") : a.name }),
        el("span", { text: secret ? t("ach.hiddenDesc") : a.desc }),
        a.target && !pr.done && !secret ? el("span", { class: "bar", style: `--p:${pr.value / pr.target}` }) : null),
      el("span", { class: "ach-meta", text: pr.done ? new Date(P.get().achievements[a.id]).toLocaleDateString("vi-VN") : a.target && !secret ? `${pr.value}/${pr.target}` : t("ach.locked") }),
      el("small", { class: "ach-id", text: a.id }));
    list.append(li);
  }
  root.append(el("div", { class: "screen ach-screen" },
    el("header", { class: "topbar" }, btn(t("ui.back"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("title.achievements") }), el("span", { class: "chip", text: `${got}/${DATA.achievements.length}` })),
    el("div", { class: "panel dark scroll-panel" }, list)));
}
