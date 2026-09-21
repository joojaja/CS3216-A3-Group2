// Singapore weather from the National Environment Agency, served through
// the data.gov.sg open APIs. No API key required.

const NEA_BASE_URL = "https://api-open.data.gov.sg/v2/real-time/api";
const NEA_24H_URL = `${NEA_BASE_URL}/twenty-four-hr-forecast`;
const NEA_OUTLOOK_URL = `${NEA_BASE_URL}/four-day-outlook`;

// Responses are cached for 15 minutes in the Next.js data cache, so repeated
// page loads and recommendations do not hammer the upstream API.
const REVALIDATE_SECONDS = 900;

export type SingaporeForecast = {
  // Calendar date in Singapore (YYYY-MM-DD) that the forecast is for
  date: string;
  summary: string;
  // Compact condition summary retained for non-rail consumers.
  short: string;
  temperature: string | null;
  humidity: string | null;
  condition: string | null;
  source: string;
  fetchedAt: string;
};

// Both NEA endpoints describe a day with the same block shape. The outlook
// adds a timing hint in forecast.summary, e.g. "Afternoon thundery showers".
type Range = { low?: number; high?: number };

type ForecastBlock = {
  forecast?: { text?: string; code?: string; summary?: string };
  temperature?: Range;
  relativeHumidity?: Range;
  wind?: { direction?: string; speed?: Range };
};

type OutlookDay = ForecastBlock & { day?: string; timestamp?: string };

function readRange(value: Range | undefined): string | null {
  if (!value || (value.low == null && value.high == null)) return null;
  return `${value.low ?? "?"}-${value.high ?? "?"}`;
}

function toForecast(
  block: ForecastBlock,
  date: string,
  source: string,
): SingaporeForecast {
  const condition = block.forecast?.text ?? block.forecast?.code ?? null;
  const detail = block.forecast?.summary?.trim() || condition;
  const temperature = readRange(block.temperature);
  const humidity = readRange(block.relativeHumidity);
  const wind = readRange(block.wind?.speed);

  const summary = [
    detail && `General: ${detail}`,
    temperature && `Temperature: ${temperature}C`,
    humidity && `Humidity: ${humidity}%`,
    wind && `Wind: ${wind} km/h ${block.wind?.direction ?? ""}`.trim(),
  ]
    .filter(Boolean)
    .join(". ");

  const short = [
    block.temperature &&
      `${block.temperature.low ?? "?"} to ${block.temperature.high ?? "?"}°C`,
    condition,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    date,
    summary,
    short,
    temperature,
    humidity,
    condition,
    source,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchRecord(url: string) {
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.records?.[0] ?? null;
}

// Singapore has no daylight saving, so a fixed time zone lookup is enough.
function todayInSingapore(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Island-wide forecast for the next 24 hours.
export async function getSingaporeForecast(): Promise<SingaporeForecast | null> {
  try {
    const record = await fetchRecord(NEA_24H_URL);
    if (!record?.general) return null;
    return toForecast(
      record.general,
      todayInSingapore(),
      "NEA 24-hour forecast via data.gov.sg",
    );
  } catch {
    return null;
  }
}

// One forecast per day for the four days after today, earliest first.
export async function getSingaporeOutlook(): Promise<SingaporeForecast[]> {
  try {
    const record = await fetchRecord(NEA_OUTLOOK_URL);
    const days: OutlookDay[] = Array.isArray(record?.forecasts)
      ? record.forecasts
      : [];
    return days
      .filter((day) => typeof day.timestamp === "string")
      .map((day) =>
        toForecast(
          day,
          // Timestamps carry the +08:00 offset, so the first ten characters
          // are already the Singapore calendar date
          (day.timestamp as string).slice(0, 10),
          "NEA 4-day outlook via data.gov.sg",
        ),
      );
  } catch {
    return [];
  }
}

// Forecast for a Singapore calendar date given as YYYY-MM-DD. Today comes
// from the 24-hour forecast and the next four days from the outlook. Returns
// null for malformed input, past dates, dates beyond the outlook, or when
// NEA is unreachable, so callers can fall back the same way they do today.
export async function getSingaporeForecastForDate(
  date: string,
): Promise<SingaporeForecast | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (date === todayInSingapore()) return getSingaporeForecast();
  const outlook = await getSingaporeOutlook();
  return outlook.find((day) => day.date === date) ?? null;
}
