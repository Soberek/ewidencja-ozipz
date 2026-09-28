// Lokalne wydanie. GitHub Actions tylko kompiluje instalator .exe — wszystko inne dzieje się tutaj:
// testy, build, podbicie wersji, commit, tag, push, pobranie instalatora, latest.json i wydanie na GitHubie.
//
// Użycie:
//   pnpm release patch | minor | major | 1.2.3   pełne wydanie
//   pnpm release --publish v1.2.3                 tylko publikacja (gdy tag już jest, np. po przerwaniu skryptu)
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WORKFLOW = "release.yml";

const run = (command, ...args) => execFileSync(command, args, { stdio: "inherit" });
const read = (command, ...args) => execFileSync(command, args, { encoding: "utf8" }).trim();
const tryRead = (command, ...args) => {
  try { return read(command, ...args); } catch { return ""; }
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};
const step = (message) => console.log(`\n▶ ${message}\n`);

function prepare(arg) {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const current = packageJson.version;
  const bump = (part) => {
    const [major, minor, patch] = current.split(".").map(Number);
    if (part === "major") return `${major + 1}.0.0`;
    if (part === "minor") return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
  };
  const next = ["patch", "minor", "major"].includes(arg) ? bump(arg) : arg;
  if (!/^\d+\.\d+\.\d+$/.test(next)) fail(`Nieprawidłowa wersja „${next}”`);
  const tag = `v${next}`;
  console.log(`\n▶ Wydanie ${current} → ${next}`);

  // Tag ma wskazywać dokładnie ten kod, który przeszedł testy, więc repozytorium musi być czyste i aktualne.
  if (read("git", "rev-parse", "--abbrev-ref", "HEAD") !== "main") fail("Wydania robimy z gałęzi main");
  if (read("git", "status", "--porcelain")) fail("Masz niezacommitowane zmiany. Zacommituj je albo schowaj przed wydaniem.");
  run("git", "fetch", "--quiet", "--tags", "origin");
  if (read("git", "rev-list", "--count", "HEAD..origin/main") !== "0") fail("Lokalny main jest za origin/main. Zrób najpierw git pull.");
  if (read("git", "tag", "-l", tag)) fail(`Tag ${tag} już istnieje. Aby tylko opublikować wydanie: pnpm release --publish ${tag}`);

  step("Testy JS");
  run("pnpm", "test");
  step("Testy Rust");
  run("cargo", "test", "--quiet", "--manifest-path", "src-tauri/Cargo.toml");
  step("Build frontendu (tsc + vite)");
  run("pnpm", "build");

  if (next !== current) {
    // package.json jest źródłem wersji dla tauri.conf.json; Cargo trzymamy w zgodzie dla porządku.
    packageJson.version = next;
    writeFileSync("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);
    const cargoToml = readFileSync("src-tauri/Cargo.toml", "utf8");
    writeFileSync("src-tauri/Cargo.toml", cargoToml.replace(/^version = "[^"]+"/m, `version = "${next}"`));
    const cargoLock = readFileSync("src-tauri/Cargo.lock", "utf8");
    writeFileSync("src-tauri/Cargo.lock", cargoLock.replace(/(name = "ewidencja-ozipz"\nversion = )"[^"]+"/, `$1"${next}"`));
    run("git", "add", "package.json", "src-tauri/Cargo.toml", "src-tauri/Cargo.lock");
    run("git", "commit", "--quiet", "-m", `Wydanie ${tag}`);
  }
  run("git", "tag", "-a", tag, "-m", `Ewidencja OZiPZ ${next}`);
  // Atomowo: na GitHuba trafiają oba albo żaden.
  step(`Wysyłanie main i ${tag} na GitHuba`);
  run("git", "push", "--atomic", "origin", "main", tag);
  return tag;
}

async function findRun(tag) {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const runs = JSON.parse(read("gh", "run", "list", "--workflow", WORKFLOW, "--limit", "20", "--json", "databaseId,headBranch,createdAt"));
    const match = runs.filter((r) => r.headBranch === tag).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (match) return match.databaseId;
    await sleep(5000);
  }
  fail(`Nie znaleziono buildu dla ${tag}. Sprawdź zakładkę Actions na GitHubie.`);
}

function findFile(directory, suffix) {
  const found = readdirSync(directory, { recursive: true }).map(String).find((name) => name.endsWith(suffix));
  if (!found) fail(`W pobranym artefakcie brakuje pliku *${suffix}`);
  return join(directory, found);
}

function releaseNotes(tag) {
  const previous = tryRead("git", "describe", "--tags", "--abbrev=0", `${tag}^`);
  const commits = read("git", "log", "--no-merges", "--format=- %s", previous ? `${previous}..${tag}` : tag)
    .split("\n").filter((line) => line && !/^- Wydanie v\d/.test(line));
  const changes = previous && commits.length ? `\n\n## Zmiany od ${previous}\n${commits.join("\n")}` : "";
  return `Pobierz **Ewidencja-OZiPZ_…_x64-setup.exe** i uruchom. Instalacja nie wymaga uprawnień administratora, a zainstalowana aplikacja sama powiadamia o kolejnych wersjach.${changes}`;
}

async function publish(tag) {
  const version = tag.replace(/^v/, "");
  const repo = read("gh", "repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner");
  if (tryRead("gh", "release", "view", tag, "--json", "tagName")) fail(`Wydanie ${tag} już istnieje: https://github.com/${repo}/releases/tag/${tag}`);

  step(`Czekam na build instalatora na GitHubie (zwykle 10–20 min)`);
  const runId = await findRun(tag);
  console.log(`  https://github.com/${repo}/actions/runs/${runId}`);
  try {
    run("gh", "run", "watch", String(runId), "--exit-status", "--interval", "30");
  } catch {
    fail(`Build się nie powiódł. Szczegóły: gh run view ${runId} --log-failed\n  Po naprawie zrób nowe wydanie (pnpm release patch).`);
  }

  step("Pobieranie instalatora");
  const directory = mkdtempSync(join(tmpdir(), `ozipz-${tag}-`));
  run("gh", "run", "download", String(runId), "-n", `instalator-${tag}`, "-D", directory);
  // GitHub zamienia spacje w nazwach plików wydania na kropki, więc nadajemy nazwę bez spacji.
  const installerName = `Ewidencja-OZiPZ_${version}_x64-setup.exe`;
  const installer = join(directory, installerName);
  const signature = readFileSync(findFile(directory, "-setup.exe.sig"), "utf8").trim();
  renameSync(findFile(directory, "-setup.exe"), installer);

  const url = `https://github.com/${repo}/releases/download/${tag}/${installerName}`;
  const latestJson = join(directory, "latest.json");
  writeFileSync(latestJson, `${JSON.stringify({
    version,
    notes: `Ewidencja OZiPZ ${version}`,
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": { signature, url },
      "windows-x86_64-nsis": { signature, url },
    },
  }, null, 2)}\n`);

  step(`Publikowanie wydania ${tag}`);
  run("gh", "release", "create", tag, installer, latestJson,
    "--verify-tag", "--latest", "--title", `Ewidencja OZiPZ ${version}`, "--notes", releaseNotes(tag));

  const check = await fetch(`https://github.com/${repo}/releases/latest/download/latest.json`).catch(() => null);
  const published = check?.ok ? (await check.json()).version : null;
  if (published !== version) console.warn(`\n⚠ latest.json wskazuje wersję ${published ?? "?"} zamiast ${version}. Aplikacje mogą nie widzieć aktualizacji.`);

  console.log(`\n✔ Wydanie ${tag} gotowe: https://github.com/${repo}/releases/tag/${tag}\n`);
}

const [first, second] = process.argv.slice(2);
if (!first) fail("Podaj wersję: pnpm release patch | minor | major | 1.2.3  (albo --publish v1.2.3)");
if (first === "--publish") {
  if (!/^v\d+\.\d+\.\d+$/.test(second ?? "")) fail("Podaj tag: pnpm release --publish v1.2.3");
  await publish(second);
} else {
  await publish(prepare(first));
}
