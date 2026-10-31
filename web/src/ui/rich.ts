/**
 * Văn bản có công thức: `$...$` (trong dòng), `$$...$$` (khối riêng) dựng bằng KaTeX, và khối giả mã
 * thuật toán `[[algo]] ... [[/algo]]` (mỗi dòng một bước, từ khóa được tô đậm). Dùng cho công thức Toán,
 * đại số quan hệ trong CSDL (σ, π, ⋈) và thuật toán.
 *
 * KaTeX và phông của nó được đóng gói kèm (chạy offline) nhưng chỉ tải khi có công thức, nên máy yếu
 * không phải tải thêm gì cho các màn không có công thức. Trước khi tải xong, chữ hiện nguyên văn.
 * Viết `\$` để có dấu đô-la thường.
 */

import { el } from "./dom";

type Katex = { render: (tex: string, node: HTMLElement, opts: Record<string, unknown>) => void };
let katex: Promise<Katex> | null = null;
function loadKatex() {
  katex ??= Promise.all([import("katex"), import("katex/dist/katex.min.css")]).then(([m]) => (m.default ?? m) as unknown as Katex);
  return katex;
}

export const hasRich = (text: string) => /(^|[^\\])\$|\[\[algo\]\]/.test(text);

const KEYWORDS = /\b(nếu|thì|ngược lại|với mỗi|với mọi|lặp|trong khi|khi|trả về|gán|cho|đến|chọn|xóa|thêm|if|then|else|for|each|while|return|do|end)\b/giu;

/** Khối giả mã: giữ thụt lề, đánh số dòng, tô đậm từ khóa; công thức trong dòng vẫn dùng `$...$`. */
function algoBlock(src: string) {
  const lines = src.replace(/^\n+|\n+$/g, "").split("\n");
  const ol = el("ol", { class: "algo" });
  for (const line of lines) {
    const li = el("li");
    li.style.paddingLeft = `${(line.match(/^\s*/)![0].length / 2) * 1.2}em`;
    inline(li, line.trim(), true);
    ol.append(li);
  }
  return ol;
}

/** Ghép chữ thường và công thức trong một dòng. */
function inline(host: HTMLElement, text: string, keywords = false) {
  const parts = text.split(/(\$\$[^$]+\$\$|(?<!\\)\$[^$]+?(?<!\\)\$)/g);
  for (const part of parts) {
    if (!part) continue;
    const display = part.startsWith("$$") && part.endsWith("$$") && part.length > 4;
    const math = display || (part.startsWith("$") && part.endsWith("$") && part.length > 2);
    if (math) {
      const tex = display ? part.slice(2, -2) : part.slice(1, -1);
      const span = el(display ? "div" : "span", { class: display ? "math-block" : "math", text: tex });
      host.append(span);
      void loadKatex().then((k) => { try { k.render(tex, span, { displayMode: display, throwOnError: false, output: "htmlAndMathml" }); } catch { /* giữ nguyên văn */ } });
    } else if (keywords) {
      let last = 0;
      for (const m of part.matchAll(KEYWORDS)) {
        host.append(part.slice(last, m.index), el("b", { class: "algo-kw", text: m[0] }));
        last = m.index! + m[0].length;
      }
      host.append(part.slice(last).replaceAll("\\$", "$"));
    } else host.append(part.replaceAll("\\$", "$"));
  }
}

/** Đổ `text` vào `host` (thay nội dung cũ). Không có công thức thì chỉ là textContent. */
export function setRich(host: HTMLElement, text: string) {
  if (!hasRich(text)) { host.textContent = text; return host; }
  host.replaceChildren();
  const chunks = text.split(/\[\[algo\]\]([\s\S]*?)\[\[\/algo\]\]/g);
  chunks.forEach((chunk, i) => {
    if (i % 2) host.append(algoBlock(chunk));
    else if (chunk.trim()) inline(host, chunk);
  });
  return host;
}

/** Tạo phần tử (mặc định <p>) chứa văn bản có công thức. */
export function rich<K extends keyof HTMLElementTagNameMap>(text: string, tag: K = "p" as K, attrs: Record<string, string> = {}) {
  return setRich(el(tag, attrs), text);
}
