type LogDetails = Record<string, boolean | number | string | null | undefined>;

function writeLog(
  level: "info" | "error",
  event: string,
  details: LogDetails = {},
): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details,
  });

  if (level === "error") {
    console.error(entry);
    return;
  }
  console.info(entry);
}

export const logger = {
  info(event: string, details?: LogDetails) {
    writeLog("info", event, details);
  },
  error(event: string, details?: LogDetails) {
    writeLog("error", event, details);
  },
};
