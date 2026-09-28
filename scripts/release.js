// Lokalne wydanie: testy, build, podbicie wersji, commit, tag i push.
// GitHub Actions tylko buduje instalator .exe z wypchniętego tagu.
// Użycie: pnpm release patch | minor | major | 1.2.3
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const run = (command) => execSync(command, { stdio: "inherit" });
const read = (command) => execSync(command, { encoding: "utf8" }).trim();
const fail = (message) => {
  console.error(`\n✖ ${message}`);
  process.exit(1);
};

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const current = packageJson.version;
const arg = process.argv[2];
if (!arg) fail("Podaj wersję: pnpm release patch | minor | major | 1.2.3");

const bump = (version, part) => {
  const [major, minor, patch] = version.split(".").map(Number);
  if (part === "major") return `${major + 1}.0.0`;
  if (part === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};
const next = ["patch", "minor", "major"].includes(arg) ? bump(current, arg) : arg;
if (!/^\d+\.\d+\.\d+$/.test(next)) fail(`Nieprawidłowa wersja „${next}”`);
const tag = `v${next}`;

console.log(`\n▶ Wydanie ${current} → ${next}\n`);

// 1. Repozytorium musi być czyste i zgodne z GitHubem, żeby tag wskazywał dokładnie przetestowany kod.
if (read("git rev-parse --abbrev-ref HEAD") !== "main") fail("Wydania robimy z gałęzi main");
if (read("git status --porcelain")) fail("Masz niezacommitowane zmiany. Zacommituj je albo schowaj przed wydaniem.");
run("git fetch --quiet --tags origin");
if (read("git rev-list --count HEAD..origin/main") !== "0") fail("Lokalny main jest za origin/main. Zrób najpierw git pull.");
if (read(`git tag -l ${tag}`)) fail(`Tag ${tag} już istnieje`);

// 2. Testy i build — cały CI, poza budowaniem instalatora.
console.log("\n▶ Testy JS\n");
run("pnpm test");
console.log("\n▶ Testy Rust\n");
run("cargo test --quiet --manifest-path src-tauri/Cargo.toml");
console.log("\n▶ Build frontendu (tsc + vite)\n");
run("pnpm build");

// 3. Wersja w package.json (z niej korzysta tauri.conf.json) oraz w Cargo.toml/Cargo.lock.
packageJson.version = next;
writeFileSync("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);
const cargoToml = readFileSync("src-tauri/Cargo.toml", "utf8");
writeFileSync("src-tauri/Cargo.toml", cargoToml.replace(/^version = "[^"]+"/m, `version = "${next}"`));
const cargoLock = readFileSync("src-tauri/Cargo.lock", "utf8");
writeFileSync(
  "src-tauri/Cargo.lock",
  cargoLock.replace(/(name = "ewidencja-ozipz"\nversion = )"[^"]+"/, `$1"${next}"`),
);

// 4. Commit, tag i atomowy push — albo trafiają na GitHuba oba, albo żaden.
run("git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock");
run(`git commit --quiet -m "Wydanie ${tag}"`);
run(`git tag -a ${tag} -m "Ewidencja OZiPZ ${next}"`);
run(`git push --atomic origin main ${tag}`);

const repo = read("gh repo view --json nameWithOwner -q .nameWithOwner");
console.log(`\n✔ Wypchnięto ${tag}. Build instalatora: https://github.com/${repo}/actions`);
console.log(`  Wydanie pojawi się tu: https://github.com/${repo}/releases/tag/${tag}\n`);
