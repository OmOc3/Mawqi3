export const userRoles = ["client", "technician", "supervisor", "manager"] as const;
export type SharedUserRole = (typeof userRoles)[number];

export const reportStatusOptions = [
  "station_ok",
  "station_replaced",
  "bait_changed",
  "bait_ok",
  "station_excluded",
  "station_substituted",
] as const;
export type SharedStatusOption = (typeof reportStatusOptions)[number];

export const reviewStatuses = ["pending", "reviewed", "rejected"] as const;
export type SharedReviewStatus = (typeof reviewStatuses)[number];

/** Pest categories for execution program (QR / field reports). */
export const pestTypeOptions = [
  "flying_insects",
  "crawling_insects",
  "rodents",
  "reptiles",
  "others",
] as const;
export type SharedPestTypeOption = (typeof pestTypeOptions)[number];

export const pestTypeLabels: Record<SharedPestTypeOption, string> = {
  flying_insects: "حشرات طائرة",
  crawling_insects: "حشرات زاحفة",
  rodents: "قوارض",
  reptiles: "زواحف",
  others: "أخرى",
};

export const pestTypeLabelsEnglish: Record<SharedPestTypeOption, string> = {
  flying_insects: "Flying insects",
  crawling_insects: "Crawling insects",
  rodents: "Rodents",
  reptiles: "Reptiles",
  others: "Others",
};

export interface StatusOptionEntry {
  labelArabic: string;
  labelEnglish: string;
  value: SharedStatusOption;
}

export const statusOptionLabels: Record<SharedStatusOption, string> = {
  station_ok: "المحطة سليمة",
  station_replaced: "تم تغيير المحطة",
  bait_changed: "تم تغيير الطعم",
  bait_ok: "الطعم سليم",
  station_excluded: "استبعاد المحطة",
  station_substituted: "استبدال المحطة",
};

export const statusOptionLabelsEnglish: Record<SharedStatusOption, string> = {
  station_ok: "Station is clear",
  station_replaced: "Station was changed",
  bait_changed: "Bait was changed",
  bait_ok: "Bait is clear",
  station_excluded: "Station excluded",
  station_substituted: "Station substituted",
};

export const statusOptionEntries: readonly StatusOptionEntry[] = reportStatusOptions.map((value) => ({
  labelArabic: statusOptionLabels[value],
  labelEnglish: statusOptionLabelsEnglish[value],
  value,
}));

export const roleLabels: Record<SharedUserRole, string> = {
  client: "عميل",
  technician: "فني",
  supervisor: "مشرف",
  manager: "مدير",
};

export const roleLabelsEnglish: Record<SharedUserRole, string> = {
  client: "Client",
  technician: "Technician",
  supervisor: "Supervisor",
  manager: "Manager",
};
