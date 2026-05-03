"use client";

import { useState, useTransition } from "react";
import { generateManagerInsightsAction } from "@/app/actions/insights";
import { useLanguage } from "@/components/i18n/language-provider";
import type { I18nMessages } from "@/lib/i18n";
import type { AiInsightsResult } from "@/types";

function SourceBadge({ messages, source }: { messages: I18nMessages; source: AiInsightsResult["source"] | undefined }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--primary)]" />
      {source === "gemini" ? messages.insights.sourceGemini : messages.insights.sourceFallback}
    </div>
  );
}

export function AIInsightsCard() {
  const { messages } = useLanguage();
  const [insights, setInsights] = useState<AiInsightsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <SourceBadge messages={messages} source={insights?.source} />
          <div>
            <h2 className="section-heading text-base">{messages.insights.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{messages.insights.subtitle}</p>
          </div>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-all duration-150 hover:bg-[var(--primary-hover)] hover:shadow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              setError(null);
              const result = await generateManagerInsightsAction();

              if (result.error && !result.insights) {
                setError(result.error);
                setInsights(null);
                return;
              }

              setError(result.error ?? null);
              setInsights(result.insights ?? null);
            });
          }}
          type="button"
        >
          {isPending ? (
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : null}
          {isPending ? messages.insights.generating : messages.insights.generate}
        </button>
      </div>

      {error ? (
        <div
          className="mt-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {insights ? (
        <div className="mt-5 space-y-6 border-t border-[var(--border)] pt-5" aria-live="polite" role="status">
          <div className="space-y-2">
            <p className="text-sm leading-7 text-[var(--foreground)]">{insights.summary}</p>
            <p className="text-xs font-medium text-[var(--muted)]">
              {messages.insights.generatedAt}: {insights.generatedAt}
            </p>
            {insights.note ? <p className="text-xs font-medium text-[var(--warning)]">{insights.note}</p> : null}
          </div>

          {insights.dataCoverage?.length ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{messages.insights.dataCoverage}</h3>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {insights.dataCoverage.map((item) => (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2" key={item.key}>
                    <p className="text-xs font-semibold text-[var(--muted)]">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                      {item.includedRows} / {item.totalRows}
                    </p>
                    {item.truncated ? (
                      <p className="mt-1 text-xs font-semibold text-[var(--warning)]">{messages.insights.dataTruncated}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {insights.fullReport ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{messages.insights.fullReport}</h3>
              <p className="whitespace-pre-line rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-7 text-[var(--foreground)]">
                {insights.fullReport}
              </p>
            </div>
          ) : null}

          {insights.sections?.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {insights.sections.map((section) => (
                <article className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4" key={section.title}>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{section.body}</p>
                  {section.items.length ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                      {section.items.map((item) => (
                        <li className="flex gap-3" key={item}>
                          <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{messages.insights.alerts}</h3>
              <ul className="space-y-3 text-sm leading-6 text-[var(--foreground)]">
                {insights.alerts.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--warning)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{messages.insights.recommendations}</h3>
              <ul className="space-y-3 text-sm leading-6 text-[var(--foreground)]">
                {insights.recommendations.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {insights.dataQualityNotes?.length ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{messages.insights.dataQuality}</h3>
              <ul className="space-y-2 text-sm leading-6 text-[var(--muted)]">
                {insights.dataQualityNotes.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--muted)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
