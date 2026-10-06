import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const cameraConfig = path.join(projectRoot, "camera", "mediamtx.yml");
const mediaMtx = process.env.MEDIA_MTX_PATH
  || path.join(
    process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, "AppData", "Local"),
    "SatarkDrishti",
    "MediaMTX-v1.21.1",
    "mediamtx.exe",
  );
const vite = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");

for (const requiredPath of [cameraConfig, mediaMtx, vite]) {
  if (!existsSync(requiredPath)) {
    console.error(`Required file not found: ${requiredPath}`);
    process.exit(1);
  }
}

const children = [];
let stopping = false;

function stopAll(exitCode) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
  process.exitCode = exitCode;
}

function startServer(name, executable, args) {
  const child = spawn(executable, args, {
    cwd: projectRoot,
    stdio: "inherit",
    windowsHide: true,
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(`${name} failed to start: ${error.message}`);
    stopAll(1);
  });
  child.on("exit", (code, signal) => {
    if (stopping) return;
    console.error(`${name} stopped unexpectedly (${signal || `exit ${code}`}).`);
    stopAll(code && code !== 0 ? code : 1);
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

startServer("Local Authority/Inspector frontend", process.execPath, [
  vite,
  "dev",
  "--host",
  "127.0.0.1",
  "--port",
  "5173",
]);
startServer("Local MediaMTX camera service", mediaMtx, [cameraConfig]);
console.log("Frontend and camera service are starting. Press Ctrl+C to stop both.");
