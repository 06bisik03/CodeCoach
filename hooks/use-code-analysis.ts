"use client";

import { useEffect, useState } from "react";

type UseCodeAnalysisResult = {
  analysis: string | null;
  isDismissed: boolean;
  error: string | null;
  dismiss: () => void;
};

function countNonEmptyLines(code: string) {
  return code
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export function useCodeAnalysis(
  code: string,
  problemSlug: string | null,
): UseCodeAnalysisResult {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!problemSlug || countNonEmptyLines(code) < 3) {
      setAnalysis(null);
      setIsDismissed(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setError(null);
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            problemSlug,
          }),
        });

        const text = (await response.text()).trim();

        if (!response.ok) {
          throw new Error(text || "Analysis failed.");
        }

        if (!cancelled) {
          setAnalysis(text || "LGTM");
          setIsDismissed(false);
        }
      } catch {
        if (!cancelled) {
          setAnalysis(null);
          setError("Code analysis is unavailable right now.");
        }
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [code, problemSlug]);

  return {
    analysis,
    isDismissed,
    error,
    dismiss: () => setIsDismissed(true),
  };
}
