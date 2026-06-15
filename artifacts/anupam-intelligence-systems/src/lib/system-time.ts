export interface SystemTimeSnapshot {
  time: string;
  timeZone: string;
  offset: string;
}

function formatOffset(date: Date, timeZone: string) {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!value || value === "GMT") return "UTC+00:00";
  return value.replace("GMT", "UTC");
}

export function formatSystemTime(
  date: Date,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
): SystemTimeSnapshot {
  return {
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone,
    }).format(date),
    timeZone,
    offset: formatOffset(date, timeZone),
  };
}
