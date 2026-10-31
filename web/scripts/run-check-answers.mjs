// Run the pure TypeScript checks without a helper process or OS account lookup.
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";

const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      try { return next(`${specifier}.ts`, context); } catch (e) { if (e.code !== "ERR_MODULE_NOT_FOUND") throw e; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!url.startsWith("file:") || !url.endsWith(".ts")) return next(url, context);
    const source = stripTypeScriptTypes(readFileSync(new URL(url), "utf8"), { mode: "strip", sourceUrl: url });
    return { format: "module", source, shortCircuit: true };
  },
});
try { await import("./check-answers.ts"); } finally { hooks.deregister(); }
