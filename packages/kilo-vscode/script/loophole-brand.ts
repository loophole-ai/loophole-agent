// Re-applies Loophole's text branding on top of upstream Kilo Code. Idempotent: safe to run after every upstream merge.
//
//   bun packages/kilo-vscode/script/loophole-brand.ts
//
// If upstream changed one of the lines below, this fails loudly instead of silently skipping it:
// open the file, apply the change by hand, and update the matching `from` string here.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const file = (p: string) => path.join(root, p)

// 1. package.json: user-visible text only. Ids, command names and setting keys are untouched.
const pkgPath = file("package.json")
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
const walk = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(walk)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
      : typeof v === "string"
        ? v.replaceAll("Kilo Code", "Loophole")
        : v
const branded = walk(pkg) as Record<string, unknown>
branded.displayName = "Loophole Agent"
branded.description =
  "AI coding agent built into the Loophole editor. Generates code from natural language, automates tasks, and runs terminal commands, with inline autocomplete and custom modes for planning, coding, and debugging."
writeFileSync(pkgPath, JSON.stringify(branded, null, 2) + "\n")

// 2. Telemetry is never sent, whatever the host editor reports.
function edit(rel: string, from: string, to: string) {
  const p = file(rel)
  const src = readFileSync(p, "utf8")
  if (src.includes(to)) return // already applied
  if (!src.includes(from)) throw new Error(`loophole-brand: expected code not found in ${rel}; upstream changed it. Update this script.`)
  writeFileSync(p, src.replace(from, to))
}
edit(
  "src/services/cli-backend/server-manager.ts",
  'KILO_TELEMETRY_LEVEL: vscode.env.isTelemetryEnabled ? "all" : "off",',
  'KILO_TELEMETRY_LEVEL: "off", // Loophole: telemetry is never sent',
)
edit(
  "src/services/telemetry/telemetry-proxy.ts",
  "  isVSCodeTelemetryEnabled(): boolean {\n    return vscode.env.isTelemetryEnabled\n  }",
  "  isVSCodeTelemetryEnabled(): boolean {\n    // Loophole: telemetry is never sent, whatever the host editor reports\n    return false\n  }",
)

// 3. Keep the unit test that pins the command category in sync with the branding above.
const testPath = file("tests/unit/extension-arch.test.ts")
const t = readFileSync(testPath, "utf8")
writeFileSync(testPath, t.replaceAll('category: "Kilo Code"', 'category: "Loophole"'))

console.log("loophole-brand: done")
