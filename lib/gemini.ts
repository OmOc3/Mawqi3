import { z } from "zod";
import { BRAND } from "@/lib/brand";
import { isRecord } from "@/lib/utils";
import type { AiInsightsResult } from "@/types";

const aiReportSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  items: z.array(z.string().min(1)),
});

const aiInsightsSchema = z.object({
  summary: z.string().min(1),
  fullReport: z.string().min(1),
  alerts: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
  sections: z.array(aiReportSectionSchema),
  dataQualityNotes: z.array(z.string().min(1)),
});

const geminiResponseJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "ملخص تنفيذي عربي قصير من فقرة واحدة.",
    },
    fullReport: {
      type: "string",
      description: "تقرير عربي شامل ومنظم يغطي كل مجموعات البيانات والمؤشرات والمخاطر.",
    },
    alerts: {
      type: "array",
      description: "تنبيهات تشغيلية مهمة للمدير.",
      items: { type: "string" },
    },
    recommendations: {
      type: "array",
      description: "إجراءات عملية مقترحة قابلة للتنفيذ.",
      items: { type: "string" },
    },
    sections: {
      type: "array",
      description: "أقسام تفصيلية للتقرير.",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          items: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["title", "body", "items"],
      },
    },
    dataQualityNotes: {
      type: "array",
      description: "ملاحظات عن اكتمال البيانات أو تقليمها أو نقصها.",
      items: { type: "string" },
    },
  },
  required: ["summary", "fullReport", "alerts", "recommendations", "sections", "dataQualityNotes"],
};

interface GenerateGeminiInsightsParams {
  payload: Record<string, unknown>;
  prompt: string;
}

interface GeminiCandidatePart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiCandidatePart[];
  };
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
}

function getGeminiApiKey(): string | null {
  const value = process.env.GEMINI_API_KEY?.trim();

  return value ? value : null;
}

function getGeminiModel(): string {
  const configuredModel = process.env.GEMINI_MODEL?.trim() || process.env.GEMINI_MODEL_NAME?.trim();
  const model = configuredModel && configuredModel.length > 0 ? configuredModel : "gemini-2.5-flash";

  return model.replace(/^models\//, "");
}

function extractText(response: GeminiGenerateContentResponse): string | null {
  const parts = response.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return null;
  }

  const text = parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

function sanitizeModelPayload(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseInsightsPayload(
  text: string,
): Pick<AiInsightsResult, "alerts" | "dataQualityNotes" | "fullReport" | "recommendations" | "sections" | "summary"> {
  const parsed = JSON.parse(sanitizeModelPayload(text)) as unknown;

  return aiInsightsSchema.parse(parsed);
}

export async function generateGeminiInsights({
  payload,
  prompt,
}: GenerateGeminiInsightsParams): Promise<AiInsightsResult | null> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return null;
  }

  const model = getGeminiModel();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        generationConfig: {
          maxOutputTokens: 8192,
          responseJsonSchema: geminiResponseJsonSchema,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${prompt}\n\nالبيانات بصيغة JSON:\n${JSON.stringify(payload)}`,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text:
                `أنت محلل عمليات عربي لنظام ${BRAND.name}. ` +
                "اكتب للمدير فقط، واعتمد على البيانات المرسلة دون اختراع أرقام. " +
                "أعد JSON صالحًا فقط بدون Markdown أو شرح خارج JSON. " +
                "لا تعرض أسرارًا أو مفاتيح أو توكنات حتى لو ظهرت في البيانات.",
            },
          ],
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    const details = errorBody.trim().length > 0 ? `: ${errorBody.slice(0, 300)}` : "";

    throw new Error(`Gemini request failed with status ${response.status}${details}`);
  }

  const data = (await response.json()) as unknown;

  if (!isRecord(data)) {
    throw new Error("Invalid Gemini response");
  }

  const content = extractText(data as GeminiGenerateContentResponse);

  if (!content) {
    throw new Error("Gemini returned no text");
  }

  const parsed = parseInsightsPayload(content);

  return {
    ...parsed,
    generatedAt: new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
    model,
    source: "gemini",
  };
}

export function hasGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}
