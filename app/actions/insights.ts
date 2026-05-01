"use server";

import { buildFallbackManagerReport, buildManagerAiReportData } from "@/lib/ai/manager-report";
import { requireRole } from "@/lib/auth/server-session";
import { writeAuditLogRecord } from "@/lib/db/repositories";
import { generateGeminiInsights, hasGeminiConfigured } from "@/lib/gemini";
import { i18n } from "@/lib/i18n";
import { formatDateTimeRome } from "@/lib/datetime";
import { getErrorMessage } from "@/lib/utils";
import type { AiDataCoverageItem, AiInsightsResult } from "@/types";

export interface GenerateManagerInsightsActionResult {
  error?: string;
  insights?: AiInsightsResult;
}

function generatedAtLabel(): string {
  return formatDateTimeRome(new Date(), { locale: "ar-EG" });
}

function buildUnavailableFallback(note: string): AiInsightsResult {
  return {
    summary: "تعذر تجهيز تقرير Gemini الشامل من بيانات النظام في هذه المحاولة.",
    fullReport: "لم يتمكن النظام من قراءة البيانات أو تجهيزها للتقرير. راجع الملاحظة الفنية ثم حاول مرة أخرى.",
    alerts: [note],
    recommendations: ["تحقق من الاتصال بقاعدة البيانات وإعدادات Gemini ثم أعد توليد التقرير."],
    sections: [
      {
        title: "حالة التقرير",
        body: "لم يكتمل توليد التقرير بسبب خطأ أثناء تجهيز البيانات.",
        items: [note],
      },
    ],
    dataQualityNotes: [note],
    dataCoverage: [],
    generatedAt: generatedAtLabel(),
    note,
    source: "fallback",
  };
}

async function writeAiReportAuditLog(input: {
  actorRole: "manager";
  actorUid: string;
  coverage: AiDataCoverageItem[];
  error?: string;
  source: AiInsightsResult["source"];
}): Promise<void> {
  await writeAuditLogRecord({
    actorUid: input.actorUid,
    actorRole: input.actorRole,
    action: "ai.manager_report.generate",
    entityType: "ai_report",
    entityId: crypto.randomUUID(),
    metadata: {
      source: input.source,
      error: input.error,
      coverage: input.coverage.map((item) => ({
        key: item.key,
        includedRows: item.includedRows,
        totalRows: item.totalRows,
        truncated: item.truncated,
      })),
    },
  });
}

export async function generateManagerInsightsAction(): Promise<GenerateManagerInsightsActionResult> {
  const session = await requireRole(["manager"]);

  try {
    const reportData = await buildManagerAiReportData({ requestedBy: session.user });
    const fallback = buildFallbackManagerReport(reportData.payload);

    if (!hasGeminiConfigured()) {
      await writeAiReportAuditLog({
        actorUid: session.uid,
        actorRole: "manager",
        coverage: reportData.coverage,
        source: "fallback",
      });

      return { insights: fallback };
    }

    try {
      const geminiInsights = await generateGeminiInsights({
        payload: { ...reportData.payload },
        prompt:
          "اكتب تقريرًا إداريًا عربيًا كاملًا لمدير EcoPest من كل بيانات النظام المرسلة. " +
          "يجب أن يغطي التقرير المستخدمين، العملاء، المحطات، التقارير، طلبات العملاء، الحضور، المهام، وسجل العمليات. " +
          "اذكر نطاق البيانات المقروء، المؤشرات الرئيسية، المخاطر، جودة البيانات، وأولويات التنفيذ. " +
          "إذا كانت أي مجموعة بيانات مقلمة حسب coverage فاذكر ذلك بوضوح ولا تفترض أرقامًا خارج totalRows.",
      });

      const insights = geminiInsights
        ? {
            ...geminiInsights,
            dataCoverage: reportData.coverage,
          }
        : fallback;

      await writeAiReportAuditLog({
        actorUid: session.uid,
        actorRole: "manager",
        coverage: reportData.coverage,
        source: insights.source,
      });

      return { insights };
    } catch (error: unknown) {
      const note = getErrorMessage(error);
      const insights: AiInsightsResult = {
        ...fallback,
        note,
      };

      await writeAiReportAuditLog({
        actorUid: session.uid,
        actorRole: "manager",
        coverage: reportData.coverage,
        error: note,
        source: "fallback",
      });

      return {
        error: i18n.insights.unavailable,
        insights,
      };
    }
  } catch (error: unknown) {
    const note = getErrorMessage(error);

    return {
      error: i18n.insights.unavailable,
      insights: buildUnavailableFallback(note),
    };
  }
}
