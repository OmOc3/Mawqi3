const stationReportPathPattern = /\/station\/([^/?#]+)\/report(?:[?#]|$)/;
const legacyClientStationPattern = /^client-station:([^:\s]+):[A-Za-z0-9-]+$/;

function decodeStationId(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value);
    const trimmed = decoded.trim();

    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function extractStationIdFromQrValue(value: string): string | null {
  const trimmed = value.trim();
  const reportUrlMatch = trimmed.match(stationReportPathPattern);

  if (reportUrlMatch?.[1]) {
    return decodeStationId(reportUrlMatch[1]);
  }

  const legacyMatch = trimmed.match(legacyClientStationPattern);

  if (legacyMatch?.[1]) {
    return decodeStationId(legacyMatch[1]);
  }

  return null;
}
