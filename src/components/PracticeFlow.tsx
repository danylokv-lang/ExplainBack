"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalyzingPanel } from "./AnalyzingPanel";
import { DiagnosisView } from "./DiagnosisView";
import { ExplainPanel } from "./ExplainPanel";
import { TopicPicker } from "./TopicPicker";
import { getStoredLanguage } from "@/lib/language-client";
import type { PresetTopic } from "@/lib/store";
import type { Attempt, ConceptMap, Diagnosis } from "@/lib/types";

type Stage = "topic" | "explain" | "analyzing" | "result";

export function PracticeFlow({
  presets,
  initialTopic,
}: {
  presets: PresetTopic[];
  initialTopic?: string;
}) {
  const [stage, setStage] = useState<Stage>("topic");
  const [map, setMap] = useState<ConceptMap | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preset = presets.find((candidate) => candidate.topic === map?.topic);

  const pickTopic = useCallback(async (topic: string) => {
    setPendingTopic(topic);
    setError(null);
    try {
      const response = await fetch("/api/concept-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language: getStoredLanguage() }),
      });
      const data = (await response.json()) as { map?: ConceptMap; error?: string };
      if (!response.ok || !data.map) {
        setError(data.error ?? "Could not build the concept map.");
        return;
      }

      // The run is opened up front so every attempt lands in history even if
      // the learner closes the tab midway through the loop.
      const runResponse = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ map: data.map }),
      });
      const runData = (await runResponse.json()) as { runId?: number };

      setMap(data.map);
      setRunId(runData.runId ?? null);
      setAttempts([]);
      setDraft("");
      setStage("explain");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPendingTopic(null);
    }
  }, []);

  useEffect(() => {
    // A deep link is the learner's own link into their own account, so any
    // topic is allowed here, not just the curated ones.
    if (initialTopic) void pickTopic(initialTopic);
    // Runs once: a deep link should not re-trigger on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);

  const analyze = useCallback(async () => {
    if (!map) return;
    setError(null);
    setStage("analyzing");

    const baseline = attempts[0];
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          map,
          runId,
          attemptIndex: attempts.length + 1,
          explanation: draft,
          language: getStoredLanguage(),
          previous: baseline
            ? { explanation: baseline.explanation, gaps: baseline.diagnosis.gaps }
            : undefined,
        }),
      });
      const data = (await response.json()) as {
        diagnosis?: Diagnosis;
        elapsedMs?: number;
        error?: string;
      };
      if (!response.ok || !data.diagnosis) {
        setError(data.error ?? "The diagnosis failed.");
        setStage("explain");
        return;
      }
      setAttempts((prev) => [
        ...prev,
        {
          index: prev.length + 1,
          explanation: draft,
          diagnosis: data.diagnosis!,
          elapsedMs: data.elapsedMs ?? 0,
        },
      ]);
      setStage("result");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setStage("explain");
    }
  }, [attempts, draft, map, runId]);

  const reset = useCallback(() => {
    setStage("topic");
    setMap(null);
    setRunId(null);
    setAttempts([]);
    setDraft("");
    setError(null);
  }, []);

  if (stage === "topic") {
    return (
      <TopicPicker
        presets={presets}
        pendingTopic={pendingTopic}
        error={error}
        onPick={pickTopic}
      />
    );
  }

  if (stage === "analyzing" && map) return <AnalyzingPanel topic={map.topic} />;

  if (stage === "result" && map && attempts.length > 0) {
    return (
      <DiagnosisView
        map={map}
        attempts={attempts}
        runId={runId}
        onRetry={() => {
          setDraft(attempts[attempts.length - 1].explanation);
          setStage("explain");
        }}
        onReset={reset}
      />
    );
  }

  if (!map) return null;

  return (
    <ExplainPanel
      topic={map.topic}
      brief={map.brief}
      attemptIndex={attempts.length + 1}
      value={draft}
      sample={preset?.sample}
      questions={attempts[attempts.length - 1]?.diagnosis.repair}
      submitting={false}
      error={error}
      onChange={setDraft}
      onSubmit={analyze}
      onBack={reset}
    />
  );
}
