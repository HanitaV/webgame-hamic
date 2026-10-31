/** Cài đặt (GDD 8.1), laid out like Minecraft's Options: "Tên: Giá trị" buttons and in-track sliders. */

import { sfx } from "../../core/audio";
import { t } from "../../core/i18n";
import { P } from "../../game/progress";
import { settings, type Settings } from "../../game/settings";
import { applySettings, refreshWorld } from "../shell";
import { btn, el, hamicChip } from "../dom";
import { confirmBox, toast } from "../overlay";
import { back } from "../router";
import { slider } from "../widgets";

type Opt =
  | { kind: "toggle"; key: keyof Settings; label: string; help: string }
  | { kind: "cycle"; key: keyof Settings; label: string; help: string; values: string[] }
  | { kind: "slider"; key: keyof Settings; label: string; help: string };

const GROUPS: { title: string; opts: Opt[] }[] = [
  { title: "set.audio", opts: [
    { kind: "toggle", key: "musicEnabled", label: "bgm.title", help: "bgm.help" },
    { kind: "slider", key: "musicVolume", label: "bgm.volume", help: "bgm.help" },
    { kind: "slider", key: "sfxVolume", label: "set.sfx", help: "set.sfxHelp" },
    { kind: "toggle", key: "mute", label: "set.mute", help: "set.muteHelp" },
  ] },
  { title: "set.display", opts: [
    { kind: "cycle", key: "textSize", label: "set.text", help: "set.textHelp", values: ["100", "115", "130"] },
    { kind: "toggle", key: "colorblind", label: "set.colorblind", help: "set.colorblindHelp" },
    { kind: "cycle", key: "reduceMotion", label: "set.motion", help: "set.motionHelp", values: ["system", "on", "off"] },
    { kind: "toggle", key: "reduceLights", label: "set.lights", help: "set.lightsHelp" },
    { kind: "toggle", key: "lowGraphics", label: "set.low", help: "set.lowHelp" },
    { kind: "toggle", key: "autoQuality", label: "set.autoQuality", help: "set.autoQualityHelp" },
  ] },
  { title: "set.play", opts: [
    { kind: "toggle", key: "assist", label: "set.assist", help: "set.assistHelp" },
    { kind: "toggle", key: "achievementToasts", label: "set.toasts", help: "set.toastsHelp" },
    { kind: "toggle", key: "haptics", label: "set.haptics", help: "set.hapticsHelp" },
  ] },
];

export function screenSettings(root: HTMLElement) {
  const help = el("p", { class: "opt-help", role: "status", text: t("set.hover") });
  const grid = el("div", { class: "options" });
  const save = (patch: Partial<Settings>) => { settings.set(patch); settings.flush(); applySettings(); refreshWorld(); };
  const valueText = (o: Opt) => {
    const v = settings.get()[o.key];
    if (o.kind === "toggle") return v ? t("ui.on") : t("ui.off");
    if (o.kind === "cycle") return t(`set.val.${String(v)}`);
    return `${Math.round(Number(v) * 100)}%`;
  };
  for (const g of GROUPS) {
    grid.append(el("h2", { class: "display opt-group", text: t(g.title) }));
    for (const o of g.opts) {
      let node: HTMLElement;
      if (o.kind === "slider") {
        node = slider({ label: t(o.label), min: 0, max: 1, step: o.key === "musicVolume" ? 0.01 : 0.05, value: Number(settings.get()[o.key]), format: (v) => `${Math.round(v * 100)}%`, onInput: (v) => save({ [o.key]: v } as Partial<Settings>) }).root;
        node.addEventListener("change", () => sfx.click());
      } else {
        const b = btn(`${t(o.label)}: ${valueText(o)}`, () => {
          const cur = settings.get()[o.key];
          if (o.kind === "toggle") save({ [o.key]: !cur } as Partial<Settings>);
          else save({ [o.key]: o.values[(o.values.indexOf(String(cur)) + 1) % o.values.length] } as Partial<Settings>);
          b.querySelector("span")!.textContent = `${t(o.label)}: ${valueText(o)}`;
        }, "opt");
        node = b;
      }
      node.dataset.opt = o.key;
      const show = () => (help.textContent = t(o.help));
      node.addEventListener("pointerenter", show);
      node.addEventListener("focusin", show);
      grid.append(node);
    }
  }
  grid.append(el("h2", { class: "display opt-group", text: t("set.data") }));
  const file = el("input", { type: "file", accept: "application/json,.json", hidden: true }) as HTMLInputElement;
  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    const ok = P.importJson(await f.text());
    toast(t(ok ? "set.importOk" : "set.importFail"), "", "info");
    applySettings();
    refreshWorld();
  });
  grid.append(
    btn(t("set.export"), () => {
      const blob = new Blob([P.exportJson()], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: "dem-toan-tin-tien-do.json" });
      document.body.append(a); a.click(); a.remove();
      toast(t("set.exported"), "", "info");
    }, "opt"),
    btn(t("set.import"), () => file.click(), "opt"),
    btn(t("set.reset"), () => confirmBox(t("set.resetTitle"), t("set.resetText"), t("set.resetYes"), () => { P.reset(); refreshWorld(); toast(t("set.resetDone"), "", "info"); }), "opt danger"),
    file);
  if (!P.saveOk()) grid.append(el("p", { class: "muted", text: t("set.noStorage") }));
  root.append(el("div", { class: "screen settings-screen" },
    el("header", { class: "topbar" }, btn(t("ui.done"), () => back(), "small ghost", {}, "back"), el("h1", { class: "display", text: t("title.settings") }), hamicChip()),
    el("div", { class: "panel dark scroll-panel" }, grid),
    help));
}
