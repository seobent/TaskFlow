import { spawn } from "node:child_process";
import { findAvailablePort, parsePort } from "./port-utils.mjs";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const defaultMobilePort = parsePort(process.env.TASKFLOW_MOBILE_PORT, 8081);
const mobilePort = await findAvailablePort(defaultMobilePort);

if (mobilePort !== defaultMobilePort) {
  console.log(
    `[dev] Expo port ${defaultMobilePort} is in use; using ${mobilePort} instead.`,
  );
}

const processes = [
  {
    name: "web",
    args: ["run", "dev:web"],
    interactive: false,
  },
  {
    name: "mobile",
    args: [
      "run",
      "web",
      "-w",
      "@taskflow/mobile",
      "--",
      "--port",
      String(mobilePort),
    ],
    env: {
      RCT_METRO_PORT: String(mobilePort),
    },
    interactive: false,
  },
];

let isShuttingDown = false;

const children = processes.map(({ name, args, env, interactive }) => {
  const command = isWindows ? `${npmCommand} ${args.join(" ")}` : npmCommand;
  const commandArgs = isWindows ? [] : args;
  const child = spawn(command, commandArgs, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    shell: isWindows,
    stdio: interactive ? "inherit" : ["ignore", "pipe", "pipe"],
  });

  if (!interactive && child.stdout) {
    child.stdout.on("data", (chunk) => {
      process.stdout.write(prefixOutput(name, chunk));
    });
  }

  if (!interactive && child.stderr) {
    child.stderr.on("data", (chunk) => {
      process.stderr.write(prefixOutput(name, chunk));
    });
  }

  child.on("exit", (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`[${name}] exited with ${reason}`);
    shutdown(code ?? 1);
  });

  child.on("error", (error) => {
    if (isShuttingDown) {
      return;
    }

    console.error(`[${name}] failed to start: ${error.message}`);
    shutdown(1);
  });

  return child;
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function shutdown(exitCode) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 250);
}

function prefixOutput(name, chunk) {
  return chunk
    .toString()
    .split(/\r?\n/)
    .map((line, index, lines) => {
      if (index === lines.length - 1 && line === "") {
        return "";
      }

      return `[${name}] ${line}`;
    })
    .join("\n");
}
