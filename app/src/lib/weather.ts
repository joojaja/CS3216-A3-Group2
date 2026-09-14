// Singapore weather from the National Environment Agency, served through
// the data.gov.sg open APIs. No API key required.

const NEA_24H_URL =
  "https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast";

export type SingaporeForecast = {
  summary: string;
  source: string;
  fetchedAt: string;
};

type ForecastValue = string | { text?: string; code?: string } | undefined;

function readValue(value: ForecastValue): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.text ?? value.code ?? null;
}

// fetch is cached for 15 minutes in the Next.js data cache, so repeated
// recommendations do not hammer the upstream API.
export async function getSingaporeForecast(): Promise<SingaporeForecast | null> {
  try {
    const res = await fetch(NEA_24H_URL, { next: { revalidate: 900 } });
    if (!res.ok) return null;

    const data = await res.json();
    const general = data?.data?.records?.[0]?.general;
    if (!general) return null;

    const parts = [
      readValue(general.forecast) && `General: ${readValue(general.forecast)}`,
      general.temperature &&
        `Temperature: ${general.temperature.low ?? "?"}-${general.temperature.high ?? "?"}C`,
      general.relativeHumidity &&
        `Humidity: ${general.relativeHumidity.low ?? "?"}-${general.relativeHumidity.high ?? "?"}%`,
      readValue(general.wind?.speed) &&
        `Wind: ${readValue(general.wind?.speed)} ${readValue(general.wind?.direction) ?? ""}`,
    ].filter(Boolean);

    return {
      summary: parts.join(". "),
      source: "NEA 24-hour forecast via data.gov.sg",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
