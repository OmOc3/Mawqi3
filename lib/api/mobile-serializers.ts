import "server-only";

import type { AppTimestamp, AppUser, AuditLog, ClientOrder, Report, Station } from "@/types";

export interface MobileStationResponse {
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt?: string;
  createdBy?: string;
  description?: string;
  distanceMeters?: number;
  isActive: boolean;
  label: string;
  lastVisitedAt?: string;
  lastVisitedBy?: string;
  location: string;
  photoUrls?: string[];
  qrCodeValue?: string;
  requiresImmediateSupervision: boolean;
  stationId: string;
  totalReports: number;
  updatedAt?: string;
  updatedBy?: string;
  zone?: string;
}

export interface MobileReportResponse {
  clientReportId?: string;
  notes?: string;
  pestTypes?: Report["pestTypes"];
  photoCount: number;
  reportId: string;
  reviewNotes?: string;
  reviewStatus: Report["reviewStatus"];
  stationId: string;
  stationLabel: string;
  stationLocation?: string;
  status: Report["status"];
  submittedAt?: string;
  technicianName: string;
  technicianUid: string;
}

export interface MobileAuditLogResponse {
  action: string;
  actorRole: AuditLog["actorRole"];
  actorUid: string;
  createdAt?: string;
  entityId: string;
  entityType: string;
  logId: string;
  metadata?: Record<string, unknown>;
}

export interface MobileClientOrderResponse {
  clientName: string;
  clientUid: string;
  createdAt?: string;
  decisionNote?: string;
  note?: string;
  orderId: string;
  photoUrl?: string;
  proposalDescription?: string;
  proposalLat?: number;
  proposalLng?: number;
  proposalLocation?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  stationId?: string;
  stationLabel: string;
  stationLocation?: string;
  status: ClientOrder["status"];
}

export interface MobileUserResponse {
  createdAt?: string;
  displayName: string;
  email: string;
  isActive: boolean;
  role: AppUser["role"];
  uid: string;
  image?: string;
}

export function timestampToIso(value: unknown): string | undefined {
  const timestamp = value as Partial<AppTimestamp>;

  if (typeof timestamp?.toDate !== "function") {
    return undefined;
  }

  return timestamp.toDate().toISOString();
}

export function mobileStationResponse(
  stationId: string,
  data: Partial<Station>,
  distanceMeters?: number,
): MobileStationResponse {
  return {
    stationId: data.stationId ?? stationId,
    label: data.label ?? "محطة بدون اسم",
    location: data.location ?? "غير محدد",
    isActive: data.isActive ?? false,
    requiresImmediateSupervision: data.requiresImmediateSupervision ?? false,
    totalReports: data.totalReports ?? 0,
    ...(data.coordinates ? { coordinates: data.coordinates } : {}),
    ...(data.createdBy ? { createdBy: data.createdBy } : {}),
    ...(data.description ? { description: data.description } : {}),
    ...(data.lastVisitedBy ? { lastVisitedBy: data.lastVisitedBy } : {}),
    ...(data.photoUrls?.length ? { photoUrls: data.photoUrls } : {}),
    ...(data.qrCodeValue ? { qrCodeValue: data.qrCodeValue } : {}),
    ...(data.updatedBy ? { updatedBy: data.updatedBy } : {}),
    ...(data.zone ? { zone: data.zone } : {}),
    ...(typeof distanceMeters === "number" ? { distanceMeters } : {}),
    ...(timestampToIso(data.createdAt) ? { createdAt: timestampToIso(data.createdAt) } : {}),
    ...(timestampToIso(data.lastVisitedAt) ? { lastVisitedAt: timestampToIso(data.lastVisitedAt) } : {}),
    ...(timestampToIso(data.updatedAt) ? { updatedAt: timestampToIso(data.updatedAt) } : {}),
  };
}

export function mobileReportResponse(report: Report): MobileReportResponse {
  const galleryCount = report.photos?.length ?? 0;
  const legacyCount =
    Number(Boolean(report.photoPaths?.before)) +
    Number(Boolean(report.photoPaths?.after)) +
    Number(Boolean(report.photoPaths?.station));

  return {
    reportId: report.reportId,
    stationId: report.stationId,
    stationLabel: report.stationLabel,
    technicianUid: report.technicianUid,
    technicianName: report.technicianName,
    status: report.status,
    reviewStatus: report.reviewStatus,
    photoCount: galleryCount > 0 ? galleryCount : legacyCount,
    ...(report.clientReportId ? { clientReportId: report.clientReportId } : {}),
    ...(report.notes ? { notes: report.notes } : {}),
    ...(report.reviewNotes ? { reviewNotes: report.reviewNotes } : {}),
    ...(report.stationLocation ? { stationLocation: report.stationLocation } : {}),
    ...(report.pestTypes?.length ? { pestTypes: report.pestTypes } : {}),
    ...(timestampToIso(report.submittedAt) ? { submittedAt: timestampToIso(report.submittedAt) } : {}),
  };
}

export function mobileAuditLogResponse(log: AuditLog): MobileAuditLogResponse {
  return {
    logId: log.logId,
    actorUid: log.actorUid,
    actorRole: log.actorRole,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    ...(log.metadata ? { metadata: log.metadata } : {}),
    ...(timestampToIso(log.createdAt) ? { createdAt: timestampToIso(log.createdAt) } : {}),
  };
}

export function mobileClientOrderResponse(order: ClientOrder, stationLocation?: string): MobileClientOrderResponse {
  const locFromProposal = order.proposalLocation?.trim();
  const fallbackLocation =
    stationLocation ??
    (locFromProposal !== undefined && locFromProposal.length > 0 ? locFromProposal : undefined);

  return {
    clientName: order.clientName,
    clientUid: order.clientUid,
    orderId: order.orderId,
    stationLabel: order.stationLabel,
    status: order.status,
    ...(order.note ? { note: order.note } : {}),
    ...(order.photoUrl ? { photoUrl: order.photoUrl } : {}),
    ...(fallbackLocation ? { stationLocation: fallbackLocation } : {}),
    ...(typeof order.coordinates?.lat === "number" ? { proposalLat: order.coordinates.lat } : {}),
    ...(typeof order.coordinates?.lng === "number" ? { proposalLng: order.coordinates.lng } : {}),
    ...(order.decisionNote ? { decisionNote: order.decisionNote } : {}),
    ...(order.proposalDescription ? { proposalDescription: order.proposalDescription } : {}),
    ...(locFromProposal !== undefined && locFromProposal.length > 0 ? { proposalLocation: locFromProposal } : {}),
    ...(order.reviewedBy ? { reviewedBy: order.reviewedBy } : {}),
    ...(typeof order.stationId === "string" && order.stationId.length > 0 ? { stationId: order.stationId } : {}),
    ...(timestampToIso(order.createdAt) ? { createdAt: timestampToIso(order.createdAt) } : {}),
    ...(timestampToIso(order.reviewedAt) ? { reviewedAt: timestampToIso(order.reviewedAt) } : {}),
  };
}

export function mobileUserResponse(user: AppUser): MobileUserResponse {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    ...(user.image ? { image: user.image } : {}),
    ...(timestampToIso(user.createdAt) ? { createdAt: timestampToIso(user.createdAt) } : {}),
  };
}
