import { spawn } from "node:child_process";
import { findAvailablePort, parsePort } from "./port-utils.mjs";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const extraArgs = process.argv.slice(2);
const hasPortArg = extraArgs.some(
  (arg, index) =>
    arg === "--port" ||
    arg.startsWith("--port=") ||
    (arg === "-p" && index < extraArgs.length - 1),
);
const explicitPort = parsePortArg(extraArgs);
const selectedPort = explicitPort ?? (hasPortArg ? null : await findMobilePort());

const expoArgs = hasPortArg
  ? extraArgs
  : [
      "--port",
      String(selectedPort),
      ...extraArgs,
    ];

const npmArgs = ["run", "web", "-w", "@taskflow/mobile", "--", ...expoArgs];
const command = isWindows
  ? `${npmCommand} ${npmArgs.map(quoteWindowsArg).join(" ")}`
  : npmCommand;
const commandArgs = isWindows ? [] : npmArgs;

const child = spawn(command, commandArgs, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...(selectedPort ? { RCT_METRO_PORT: String(selectedPort) } : {}),
  },
  shell: isWindows,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(`[mobile] failed to start: ${error.message}`);
  process.exit(1);
});

async function findMobilePort() {
  const defaultMobilePort = parsePort(process.env.TASKFLOW_MOBILE_PORT, 8081);
  const mobilePort = await findAvailablePort(defaultMobilePort);

  if (mobilePort !== defaultMobilePort) {
    console.log(
      `[dev] Expo port ${defaultMobilePort} is in use; using ${mobilePort} instead.`,
    );
  }

  return mobilePort;
}

function quoteWindowsArg(arg) {
  if (/^[\w./:=@-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/(["^&|<>%])/g, "^$1")}"`;
}

function parsePortArg(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--port" || arg === "-p") {
      return parsePort(args[index + 1], null);
    }

    if (arg.startsWith("--port=")) {
      return parsePort(arg.slice("--port=".length), null);
    }
  }

  return null;
}
