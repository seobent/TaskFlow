import { createServer } from "node:net";

export function parsePort(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
    return parsed;
  }

  return fallback;
}

export async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 20 && port < 65536; port += 1) {
    if (await isPortAvailable(port, null)) {
      return port;
    }
  }

  throw new Error(
    `No available Expo port found from ${startPort} to ${Math.min(startPort + 19, 65535)}.`,
  );
}

function isPortAvailable(port, host) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen({ port, host });
  });
}
