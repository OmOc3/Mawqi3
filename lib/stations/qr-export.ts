import type { Station } from "@/types";

export const stationQrExportScopes = ["selected", "all", "last-day", "last-7-days"] as const;
export type StationQrExportScope = (typeof stationQrExportScopes)[number];

export const stationQrExportFallbackClient = "غير مرتبط";
export const technicianScanUrl = "https://ecopest-production.vercel.app/scan";

export interface StationQrExportClientAccess {
  clientName?: string | null;
  stationId: string;
}

export interface StationQrExportItem {
  clientName: string;
  createdAt: Date;
  label: string;
  qrCodeValue: string;
  stationId: string;
}

export function parseStationQrExportScope(value: string | null | undefined): StationQrExportScope {
  return stationQrExportScopes.includes(value as StationQrExportScope) ? (value as StationQrExportScope) : "selected";
}

export function uniqueStationIds(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function dateFromForStationQrScope(scope: StationQrExportScope, now = new Date()): Date | null {
  const date = new Date(now);

  if (scope === "last-day") {
    date.setDate(date.getDate() - 1);
    return date;
  }

  if (scope === "last-7-days") {
    date.setDate(date.getDate() - 7);
    return date;
  }

  return null;
}

export function stationMatchesQrExportScope(
  station: Pick<Station, "createdAt">,
  scope: StationQrExportScope,
  now = new Date(),
): boolean {
  const dateFrom = dateFromForStationQrScope(scope, now);

  if (!dateFrom) {
    return true;
  }

  return station.createdAt.toDate().getTime() >= dateFrom.getTime();
}

export function stationClientNamesByStationId(
  rows: readonly StationQrExportClientAccess[],
): Map<string, string> {
  const namesByStation = new Map<string, Set<string>>();

  for (const row of rows) {
    const clientName = row.clientName?.trim();

    if (!clientName) {
      continue;
    }

    const names = namesByStation.get(row.stationId) ?? new Set<string>();
    names.add(clientName);
    namesByStation.set(row.stationId, names);
  }

  return new Map(
    Array.from(namesByStation.entries()).map(([stationId, names]) => [
      stationId,
      Array.from(names).join("، "),
    ]),
  );
}

export function qrCodeValueLooksLikeStationReportUrl(value: string, stationId: string): boolean {
  try {
    const url = new URL(value);
    const expectedPath = `/station/${encodeURIComponent(stationId)}/report`;
    return url.pathname === expectedPath || url.pathname === `/station/${stationId}/report`;
  } catch {
    return false;
  }
}

export async function resolveStationQrCodeValue(
  station: Pick<Station, "qrCodeValue" | "stationId">,
  buildUrl: (stationId: string) => Promise<string>,
): Promise<string> {
  if (qrCodeValueLooksLikeStationReportUrl(station.qrCodeValue, station.stationId)) {
    return station.qrCodeValue;
  }

  return buildUrl(station.stationId);
}

export async function toStationQrExportItems(
  stations: readonly Station[],
  clientNames: ReadonlyMap<string, string>,
  buildUrl: (stationId: string) => Promise<string>,
): Promise<StationQrExportItem[]> {
  return Promise.all(
    stations.map(async (station) => ({
      clientName: clientNames.get(station.stationId) ?? stationQrExportFallbackClient,
      createdAt: station.createdAt.toDate(),
      label: station.label,
      qrCodeValue: await resolveStationQrCodeValue(station, buildUrl),
      stationId: station.stationId,
    })),
  );
}
