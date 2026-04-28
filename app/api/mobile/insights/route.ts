import { NextRequest, NextResponse } from "next/server";
import { mobileApiErrorResponse } from "@/lib/api/mobile";
import { requireBearerRole } from "@/lib/auth/bearer-session";
import { buildStatusCounts, buildTechnicianStats, buildZoneStats } from "@/lib/analytics";
import { generateGeminiInsights, hasGeminiConfigured } from "@/lib/gemini";
import { i18n, statusOptionLabels } from "@/lib/i18n";
import { ANALYTICS_DEFAULT_RANGE_DAYS, getBoundedReportStatsInput } from "@/lib/stats/report-stats";
import { getErrorMessage } from "@/lib/utils";
import type { ApiErrorResponse, AiInsightsResult, Report, Station } from "@/types";

export const runtime = "nodejs";

function buildFallbackInsights(stations: Station[], reports: Report[]): AiInsightsResult {
  const zones = buildZoneStats(stations, reports);
  const technicians = buildTechnicianStats(reports);
  const statusSummary = buildStatusCounts(reports);
  const pendingCount = reports.filter((report) => report.reviewStatus === "pending").length;
  const activeStations = stations.filter((station) => station.isActive).length;
  const topZone = zones[0];
  const topTechnician = technicians[0];
  const topStatus = statusSummary[0];
  const alerts = [
    pendingCount > 0 ? `يوجد ${pendingCount} تقريرًا بانتظار المراجعة ويحتاج إلى إغلاق أسرع.` : null,
    topZone ? `المنطقة ${topZone.zone} تسجل أعلى نشاط بعدد ${topZone.reports} تقرير.` : null,
    topTechnician && topTechnician.pending > 0
      ? `${topTechnician.technicianName} لديه ${topTechnician.pending} تقريرًا ما زال بانتظار المراجعة.`
      : null,
  ].filter((value): value is string => Boolean(value));
  const recommendations = [
    pendingCount > 0 ? "خصص نافذة مراجعة يومية ثابتة لتقارير الفنيين المفتوحة." : "استمر على نفس وتيرة المراجعة الحالية.",
    topZone ? `راجع توزيع المحطات في ${topZone.zone} إذا استمر الحجم أعلى من باقي المناطق.` : null,
    topStatus ? `تابع سبب تكرار حالة "${statusOptionLabels[topStatus.status]}" وقيّم الحاجة لإجراء وقائي.` : null,
    activeStations < stations.length ? "راجع أسباب تعطيل المحطات غير النشطة وأعد تفعيل القابل منها." : null,
  ].filter((value): value is string => Boolean(value));

  return {
    alerts,
    generatedAt: new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
    note: hasGeminiConfigured() ? undefined : i18n.insights.missingKey,
    recommendations,
    source: "fallback",
    summary: `لديك ${stations.length} محطة، منها ${activeStations} نشطة، مع ${reports.length} تقريرًا ضمن آخر ${ANALYTICS_DEFAULT_RANGE_DAYS} يوم.`,
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<AiInsightsResult | ApiErrorResponse>> {
  try {
    await requireBearerRole(request, ["manager", "supervisor"]);

    const { reports, reportsTruncated, stations, stationsTruncated } = await getBoundedReportStatsInput();
    const fallback = buildFallbackInsights(stations, reports);

    if (reports.length === 0) {
      return NextResponse.json({
        ...fallback,
        note: "لا توجد تقارير كافية ضمن النطاق الحالي لبناء توصيات دقيقة.",
      });
    }

    const aiPayload = {
      activeStations: stations.filter((station) => station.isActive).length,
      analyticsRangeDays: ANALYTICS_DEFAULT_RANGE_DAYS,
      limits: {
        reportsTruncated,
        stationsTruncated,
      },
      pendingReviewReports: reports.filter((report) => report.reviewStatus === "pending").length,
      topStatuses: buildStatusCounts(reports).slice(0, 4).map((item) => ({
        count: item.count,
        label: statusOptionLabels[item.status],
        status: item.status,
      })),
      topTechnicians: buildTechnicianStats(reports)
        .slice(0, 4)
        .map((technician) => ({
          pending: technician.pending,
          reports: technician.reports,
          technicianName: technician.technicianName,
        })),
      topZones: buildZoneStats(stations, reports).slice(0, 4),
      totalReports: reports.length,
      totalStations: stations.length,
    };

    let geminiInsights: AiInsightsResult | null = null;

    try {
      geminiInsights = await generateGeminiInsights({
        payload: aiPayload,
        prompt:
          "اعرض موجزًا عربيًا قصيرًا للمدير. لخص الوضع التشغيلي الحالي، ثم قدم حتى 3 تنبيهات وحتى 4 توصيات عملية مباشرة قابلة للتنفيذ هذا الأسبوع.",
      });
    } catch (error: unknown) {
      return NextResponse.json({
        ...fallback,
        note: getErrorMessage(error),
      });
    }

    return NextResponse.json(
      geminiInsights
        ? {
            ...geminiInsights,
            note: fallback.note,
          }
        : fallback
    );
  } catch (error: unknown) {
    return mobileApiErrorResponse(error);
  }
}
