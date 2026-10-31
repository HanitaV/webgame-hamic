/**
 * Player settings: one typed record, saved with a schema version, and a settings screen drawn from
 * a declarative list of sections. To add a setting:
 *   1. add the field and its default to `Settings` / `defaults()`;
 *   2. add a row to `SECTIONS` (it renders and saves itself);
 *   3. react to it where it matters with `settings.subscribe(...)`.
 */

import { DEFAULT_BINDINGS, FLAGS, STORAGE, type Action } from "../config";
import { Store } from "../core/storage";
import { t } from "../i18n";
import { button, el } from "./dom";

export interface Settings {
  graphics: "light" | "fancy";
  buildingLabels: boolean;
  treeLabels: boolean;
  trees: boolean;
  uiScale: "100" | "115" | "130";
  reduceMotion: "system" | "on" | "off";
  lookSensitivity: number;
  invertY: boolean;
  dayCycle: boolean;
  hour: number;
  colliders: boolean;
  /** Overrides of DEFAULT_BINDINGS; empty until a rebinding screen exists. */
  bindings: Partial<Record<Action, string[]>>;
  language: string;
}

function legacyFancy() {
  try {
    return window.localStorage.getItem("campus-fancy") === "1";
  } catch {
    return false;
  }
}

function defaults(): Settings {
  return {
    graphics: legacyFancy() ? "fancy" : "light",
    buildingLabels: true,
    treeLabels: false,
    trees: true,
    uiScale: "100",
    reduceMotion: "system",
    lookSensitivity: 1,
    invertY: false,
    dayCycle: true,
    hour: 9,
    colliders: false,
    bindings: {},
    language: "vi",
  };
}

export const settings = new Store<Settings>({
  key: STORAGE.settings,
  version: 1,
  defaults,
  validate: (s) => ({
    ...s,
    lookSensitivity: Math.min(2, Math.max(0.4, Number(s.lookSensitivity) || 1)),
    hour: ((Number(s.hour) % 24) + 24) % 24,
    colliders: FLAGS.debug ? s.colliders : false,
  }),
});

export function bindingsFor(action: Action): string[] {
  return settings.get().bindings[action] ?? DEFAULT_BINDINGS[action];
}

export function reducedMotion(): boolean {
  const mode = settings.get().reduceMotion;
  if (mode === "on") return true;
  if (mode === "off") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------- Schema ---------- */

type Key<V> = { [K in keyof Settings]: Settings[K] extends V ? K : never }[keyof Settings];

type Field =
  | { kind: "choice"; key: Key<string>; label: string; help?: string; options: { value: string; label: string }[] }
  | { kind: "toggle"; key: Key<boolean>; label: string; help?: string }
  | { kind: "range"; key: Key<number>; label: string; help?: string; min: number; max: number; step: number; format: (v: number) => string };

interface Section {
  id: string;
  title: string;
  help: string;
  fields: Field[];
  when?: () => boolean;
}

function clock(h: number) {
  const whole = Math.floor(h) % 24;
  const minutes = Math.floor((h - Math.floor(h)) * 60);
  return `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const SECTIONS: Section[] = [
  {
    id: "graphics",
    title: "Đồ hoạ",
    help: "Bản nhẹ chạy mượt trên máy yếu và điện thoại.",
    fields: [
      {
        kind: "choice", key: "graphics", label: "Chất lượng",
        help: "Bản đẹp có bóng đổ, vân tường và mái, trời có mây, đèn đường sáng ban đêm.",
        options: [{ value: "light", label: "Nhẹ" }, { value: "fancy", label: "Đẹp" }],
      },
      { kind: "toggle", key: "trees", label: "Hiện cây" },
    ],
  },
  {
    id: "time",
    title: "Thời gian",
    help: "Một ngày trong sân dài 6 phút.",
    fields: [
      { kind: "toggle", key: "dayCycle", label: "Cho giờ trôi", help: "Tắt để giữ nguyên giờ đã chọn." },
      { kind: "range", key: "hour", label: "Giờ trong ngày", min: 0, max: 23.75, step: 0.25, format: clock },
    ],
  },
  {
    id: "display",
    title: "Hiển thị",
    help: "Nhãn tên và cỡ chữ của giao diện.",
    fields: [
      { kind: "toggle", key: "buildingLabels", label: "Nhãn tên nhà và phòng" },
      { kind: "toggle", key: "treeLabels", label: "Nhãn cây" },
      {
        kind: "choice", key: "uiScale", label: "Cỡ chữ giao diện",
        options: [{ value: "100", label: "Vừa" }, { value: "115", label: "Lớn" }, { value: "130", label: "Rất lớn" }],
      },
    ],
  },
  {
    id: "controls",
    title: "Điều khiển",
    help: "Áp dụng khi đi bộ, cả chuột và màn hình cảm ứng.",
    fields: [
      { kind: "range", key: "lookSensitivity", label: "Độ nhạy khi nhìn", min: 0.4, max: 2, step: 0.1, format: (v) => `${Math.round(v * 100)}%` },
      { kind: "toggle", key: "invertY", label: "Đảo trục dọc", help: "Đẩy chuột lên để nhìn xuống." },
    ],
  },
  {
    id: "motion",
    title: "Chuyển động",
    help: "Giảm chuyển động tắt các hiệu ứng trượt và bay camera của giao diện.",
    fields: [
      {
        kind: "choice", key: "reduceMotion", label: "Giảm chuyển động",
        options: [{ value: "system", label: "Theo máy" }, { value: "on", label: "Bật" }, { value: "off", label: "Tắt" }],
      },
    ],
  },
  {
    id: "debug",
    title: "Gỡ lỗi",
    help: "Chỉ hiện khi mở với ?debug hoặc npm run dev.",
    when: () => FLAGS.debug,
    fields: [{ kind: "toggle", key: "colliders", label: "Khung va chạm" }],
  },
];

let uid = 0;

function fieldRow(field: Field, stamp: () => void): HTMLElement {
  const id = `set-${field.key}-${(uid += 1)}`;
  const row = el("div", { class: `set-row set-${field.kind}` });
  const text = el("div", { class: "set-text" });
  const label = el(field.kind === "choice" ? "span" : "label", { class: "set-label", id: `${id}-label`, text: field.label });
  if (field.kind !== "choice") label.setAttribute("for", id);
  text.append(label);
  if (field.help) text.append(el("p", { class: "set-help", id: `${id}-help`, text: field.help }));
  row.append(text);
  const value = settings.get()[field.key];

  if (field.kind === "toggle") {
    const input = el("input", { type: "checkbox", id, role: "switch", class: "switch" }) as HTMLInputElement;
    input.checked = Boolean(value);
    if (field.help) input.setAttribute("aria-describedby", `${id}-help`);
    input.addEventListener("change", () => {
      settings.set({ [field.key]: input.checked } as Partial<Settings>);
      stamp();
    });
    settings.subscribe((s, changed) => {
      if (changed.includes(field.key)) input.checked = Boolean(s[field.key]);
    });
    row.append(input);
  } else if (field.kind === "choice") {
    const group = el("div", { class: "segmented", role: "radiogroup", "aria-labelledby": `${id}-label` });
    const buttons = field.options.map((option) => {
      const b = button(option.label, () => {
        settings.set({ [field.key]: option.value } as Partial<Settings>);
        stamp();
      });
      b.setAttribute("role", "radio");
      b.dataset.value = option.value;
      group.append(b);
      return b;
    });
    const sync = (current: string) => {
      for (const b of buttons) {
        const on = b.dataset.value === current;
        b.setAttribute("aria-checked", String(on));
        b.tabIndex = on ? 0 : -1;
      }
    };
    group.addEventListener("keydown", (event) => {
      const i = buttons.findIndex((b) => b.dataset.value === settings.get()[field.key]);
      const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const next = buttons[(i + step + buttons.length) % buttons.length];
      next.click();
      next.focus();
    });
    sync(String(value));
    settings.subscribe((s, changed) => {
      if (changed.includes(field.key)) sync(String(s[field.key]));
    });
    row.append(group);
  } else {
    const wrap = el("div", { class: "range" });
    const input = el("input", { type: "range", id, min: String(field.min), max: String(field.max), step: String(field.step) }) as HTMLInputElement;
    const out = el("output", { for: id, class: "num" });
    input.value = String(value);
    out.textContent = field.format(Number(value));
    input.addEventListener("input", () => {
      out.textContent = field.format(Number(input.value));
      settings.set({ [field.key]: Number(input.value) } as Partial<Settings>);
    });
    input.addEventListener("change", stamp);
    settings.subscribe((s, changed) => {
      if (!changed.includes(field.key) || document.activeElement === input) return;
      input.value = String(s[field.key]);
      out.textContent = field.format(Number(s[field.key]));
    });
    wrap.append(input, out);
    row.append(wrap);
  }
  return row;
}

/** Draw the settings screen body into `host`. */
export function renderSettings(host: HTMLElement) {
  host.replaceChildren();
  const status = el("p", { class: "set-status", role: "status" });
  let timer = 0;
  const stamp = () => {
    status.textContent = settings.ok ? t("settings.saved") : t("settings.notSaved");
    window.clearTimeout(timer);
    if (settings.ok) timer = window.setTimeout(() => (status.textContent = ""), 1600);
  };
  for (const section of SECTIONS) {
    if (section.when && !section.when()) continue;
    const block = el("section", { class: "set-section", "aria-labelledby": `sec-${section.id}` });
    const head = el("div", { class: "set-head" });
    head.append(el("h3", { id: `sec-${section.id}`, text: section.title }), el("p", { text: section.help }));
    const body = el("div", { class: "set-body" });
    for (const field of section.fields) body.append(fieldRow(field, stamp));
    block.append(head, body);
    host.append(block);
  }
  const foot = el("div", { class: "set-foot" });
  foot.append(
    status,
    button(t("settings.reset"), () => {
      settings.reset();
      status.textContent = t("settings.resetDone");
    }, "ghost"),
  );
  host.append(foot);
  if (!settings.ok) status.textContent = t("settings.notSaved");
}
