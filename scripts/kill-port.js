import { execSync } from "node:child_process";

const PORT = 1421;

try {
  if (process.platform === "win32") {
    execSync(`for /f "tokens=5" %a in ('netstat -aon ^| find ":${PORT}" ^| find "LISTENING"') do taskkill /f /pid %a`, {
      stdio: "ignore",
      shell: "cmd.exe",
    });
  } else {
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, {
      stdio: "ignore",
      shell: "/bin/sh",
    });
  }
} catch {
  // Ignoruj jeśli żaden proces nie zajmował portu
}
