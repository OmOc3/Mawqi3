const stationReportPathPattern = /\/station\/([^/?#]+)\/report(?:[?#]|$)/;
const serviceAreaScanPathPattern = /\/area\/([^/?#]+)\/scan(?:[?#]|$)/;
const legacyClientStationPattern = /^client-station:([^:\s]+):[A-Za-z0-9-]+$/;

export type EcoPestQrPayload =
  | {
      stationId: string;
      type: "station";
    }
  | {
      areaId: string;
      type: "area";
    };

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

export function extractServiceAreaIdFromQrValue(value: string): string | null {
  const trimmed = value.trim();
  const areaUrlMatch = trimmed.match(serviceAreaScanPathPattern);

  if (areaUrlMatch?.[1]) {
    return decodeStationId(areaUrlMatch[1]);
  }

  return null;
}

export function parseEcoPestQrValue(value: string): EcoPestQrPayload | null {
  const stationId = extractStationIdFromQrValue(value);

  if (stationId) {
    return { stationId, type: "station" };
  }

  const areaId = extractServiceAreaIdFromQrValue(value);

  if (areaId) {
    return { areaId, type: "area" };
  }

  return null;
}
