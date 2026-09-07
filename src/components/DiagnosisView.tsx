"use client";

import { useState } from "react";
import Link from "next/link";
import { ConceptGraph } from "./ConceptGraph";
import { GapList } from "./GapList";
import { useLocale } from "./LocaleProvider";
import { MetricsStrip } from "./MetricsStrip";
import { ProgressCompare } from "./ProgressCompare";
import { RepairLesson } from "./RepairLesson";
import { getStoredLanguage } from "@/lib/language-client";
import { formatSeconds } from "@/lib/i18n/pluralize";
import type { Attempt, ConceptMap, NodeStatusKind } from "@/lib/types";

interface Props {
  map: ConceptMap;
  attempts: Attempt[];
  runId: number | null;
  onRetry?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
}

export function DiagnosisView({ map, attempts, runId, onRetry, onReset, readOnly }: Props) {
  const { locale, t } = useLocale();
  const [activeGapId, setActiveGapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [cardState, setCardState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [cardMessage, setCardMessage] = useState("");

  const current = attempts[attempts.length - 1];
  const first = attempts[0];
  const { diagnosis } = current;
  const activeGap = diagnosis.gaps.find((gap) => gap.id === activeGapId) ?? null;
  const selectedNode = map.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedStatus = diagnosis.nodeStatuses.find((s) => s.nodeId === selectedNodeId);

  const LEGEND: { status: NodeStatusKind; swatch: string; note: string }[] = [
    { status: "explained", swatch: "bg-ok-bg border-ok", note: t.diagnosis.graph.legendExplained },
    { status: "shallow", swatch: "bg-warn-bg border-warn", note: t.diagnosis.graph.legendShallow },
    { status: "wrong", swatch: "bg-bad-bg border-bad", note: t.diagnosis.graph.legendWrong },
    { status: "missing", swatch: "bg-transparent border-void border-dashed", note: t.diagnosis.graph.legendMissing },
  ];

  async function generateCards() {
    if (!runId) return;
    setCardState("working");
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, language: getStoredLanguage() }),
      });
      const data = (await response.json()) as { created?: number; error?: string };
      if (!response.ok) {
        setCardState("error");
        setCardMessage(data.error ?? t.diagnosis.cardsCta.errorGeneric);
        return;
      }
      setCardState("done");
      setCardMessage(t.diagnosis.cardsCta.createdMessage(data.created ?? 0));
    } catch {
      setCardState("error");
      setCardMessage(t.diagnosis.cardsCta.errorNetwork);
    }
  }

  return (
    <div className="space-y-12 py-12">
      <header>
        <p className="label">{t.diagnosis.step(current.index)}</p>
        <h1 className="display mt-2 max-w-4xl text-4xl sm:text-5xl">{diagnosis.verdict}</h1>
      </header>

      <MetricsStrip
        coverage={diagnosis.coverage}
        depth={diagnosis.depth}
        elapsedMs={current.elapsedMs}
        gapCount={diagnosis.gaps.length}
        labels={t.diagnosis.metrics}
        formatSeconds={(ms) => formatSeconds(locale, ms)}
      />

      {diagnosis.nextStep && (
        <div className="panel flex flex-col gap-4 border-l-[3px] border-l-accent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="label text-accent">{t.diagnosis.nextStep.label}</p>
            <p className="mt-1 text-lg font-medium leading-snug text-ink">{diagnosis.nextStep}</p>
          </div>
          {diagnosis.repair.length > 0 && (
            <a href="#repair-heading" className="btn btn-primary shrink-0">
              {t.diagnosis.nextStep.cta}
            </a>
          )}
        </div>
      )}

      {attempts.length > 1 && <ProgressCompare before={first} after={current} />}

      <section aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="display text-3xl">
          {t.diagnosis.gapsSection.heading}
        </h2>
        <p className="prose-measure mt-3 leading-relaxed text-ink-2">{t.diagnosis.gapsSection.body}</p>
        <div className="mt-6">
          <GapList gaps={diagnosis.gaps} activeGapId={activeGapId} onSelect={setActiveGapId} />
        </div>
      </section>

      <section aria-labelledby="graph-heading" className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="graph-heading" className="display text-2xl">
            {t.diagnosis.graph.heading}
          </h2>
          <p className="text-sm text-ink-3">
            {map.source === "preset" ? t.diagnosis.graph.curated : t.diagnosis.graph.generated}
          </p>
        </div>
        <p className="prose-measure mt-2 leading-relaxed text-ink-2">{t.diagnosis.graph.body}</p>

        <ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          {LEGEND.map(({ status, swatch, note }) => (
            <li key={status} className="flex items-baseline gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className={`inline-block h-3 w-3 shrink-0 translate-y-0.5 border ${swatch}`}
              />
              <span>
                <span className="font-medium text-ink">{t.statuses[status]}</span>
                <span className="text-ink-3"> — {note}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <ConceptGraph
            map={map}
            statuses={diagnosis.nodeStatuses}
            activeGap={activeGap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {selectedNode && (
          <div className="anim-rise mt-6 border-t border-rule pt-6" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="display text-2xl">{selectedNode.label}</h3>
              <span className="text-sm text-ink-3">
                {selectedStatus ? t.statuses[selectedStatus.status] : "—"}
              </span>
            </div>
            <p className="prose-measure mt-2 leading-relaxed text-ink-2">
              {selectedNode.definition}
            </p>

            <p className="label mt-5">{t.diagnosis.graph.whatShouldHaveBeenSaid}</p>
            <p className="prose-measure mt-1 text-[1.0625rem] leading-relaxed text-ink">
              {selectedNode.mechanism}
            </p>

            {selectedStatus?.evidence && (
              <>
                <p className="label mt-5">{t.diagnosis.graph.whatYouWrote}</p>
                <p className="prose-measure mt-1 rounded-xl bg-sunken px-3.5 py-2.5 leading-relaxed text-ink-2">
                  &ldquo;{selectedStatus.evidence}&rdquo;
                </p>
              </>
            )}

            <p className="label mt-5 text-warn">{t.diagnosis.graph.usualWrongModel}</p>
            <p className="prose-measure mt-1 leading-relaxed text-ink-2">
              {selectedNode.misconception}
            </p>

            <button
              type="button"
              className="btn btn-ghost mt-5 px-3.5 py-2 text-sm"
              onClick={() => setSelectedNodeId(null)}
            >
              {t.diagnosis.graph.close}
            </button>
          </div>
        )}
      </section>

      <RepairLesson questions={diagnosis.repair} gaps={diagnosis.gaps} />

      <section className={`grid gap-5 ${readOnly ? "" : "lg:grid-cols-2"}`}>
        {!readOnly && onRetry && (
          <div className="panel flex flex-col justify-between p-6">
            <div>
              <h2 className="display text-2xl">{t.diagnosis.closeLoop.heading}</h2>
              <p className="mt-2 leading-relaxed text-ink-2">{t.diagnosis.closeLoop.body(first.index)}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={onRetry}>
                {t.diagnosis.closeLoop.tryAgain}
              </button>
              {onReset && (
                <button type="button" className="btn btn-ghost" onClick={onReset}>
                  {t.diagnosis.closeLoop.anotherTopic}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="panel flex flex-col justify-between p-6">
          <div>
            <h2 className="display text-2xl">{t.diagnosis.cardsCta.heading}</h2>
            <p className="prose-measure mt-2 leading-relaxed text-ink-2">{t.diagnosis.cardsCta.body}</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={generateCards}
              disabled={!runId || cardState === "working" || cardState === "done"}
            >
              {cardState === "working"
                ? t.diagnosis.cardsCta.writing
                : cardState === "done"
                  ? t.diagnosis.cardsCta.created
                  : t.diagnosis.cardsCta.generate}
            </button>
            {cardState === "done" && (
              <Link href="/app/cards" className="btn btn-ghost">
                {t.diagnosis.cardsCta.reviewNow}
              </Link>
            )}
            {cardMessage && (
              <p
                role="status"
                className={`text-[0.9375rem] ${cardState === "error" ? "text-bad" : "text-ink-2"}`}
              >
                {cardMessage}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
