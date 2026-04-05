"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import { MonacoEditorPanel } from "@/components/monaco-editor-panel";
import { useCodeAnalysis } from "@/hooks/use-code-analysis";

type LanguageOption = "Python" | "JavaScript" | "Java" | "C++";

type ProblemSummary = {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
};

type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

type ProblemDetail = ProblemSummary & {
  description: string;
  examples: unknown;
  constraints: string[];
  starterCode: Record<string, unknown>;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type HistoryMessage = {
  id: number;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type Toast = {
  id: string;
  message: string;
};

type ChatResponse = {
  reply: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  "Python",
  "JavaScript",
  "Java",
  "C++",
];

const MONACO_LANGUAGES: Record<LanguageOption, string> = {
  Python: "python",
  JavaScript: "javascript",
  Java: "java",
  "C++": "cpp",
};

const STARTER_CODE_KEYS: Record<LanguageOption, string> = {
  Python: "python",
  JavaScript: "javascript",
  Java: "java",
  "C++": "cpp",
};

const SESSION_STORAGE_KEY = "codecoach-session-id";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("cpp", cpp);

function difficultyBadgeClasses(difficulty: string) {
  switch (difficulty) {
    case "Easy":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "Medium":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "Hard":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    default:
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

async function fetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = (await response.json()) as
    | T
    | {
        error?: string;
      };

  if (!response.ok) {
    const errorMessage =
      typeof (json as { error?: string }).error === "string"
        ? (json as { error?: string }).error
        : "Request failed.";

    throw new Error(errorMessage);
  }

  return json as T;
}

function normalizeExamples(examples: unknown): ProblemExample[] {
  if (!Array.isArray(examples)) {
    return [];
  }

  return examples.flatMap((example) => {
    if (!example || typeof example !== "object") {
      return [];
    }

    const entry = example as Record<string, unknown>;

    return [
      {
        input: typeof entry.input === "string" ? entry.input : "",
        output: typeof entry.output === "string" ? entry.output : "",
        explanation:
          typeof entry.explanation === "string"
            ? entry.explanation
            : undefined,
      },
    ];
  });
}

function getStarterCode(
  problem: ProblemDetail | null,
  language: LanguageOption,
) {
  if (!problem) {
    return "";
  }

  const key = STARTER_CODE_KEYS[language];
  const value = problem.starterCode[key];

  return typeof value === "string" ? value : "";
}

export function CodeCoachWorkspace() {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [selectedProblemSlug, setSelectedProblemSlug] = useState<string | null>(
    null,
  );
  const [selectedProblem, setSelectedProblem] = useState<ProblemDetail | null>(
    null,
  );
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageOption>("Python");
  const [editorCode, setEditorCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isProblemListLoading, setIsProblemListLoading] = useState(true);
  const [isProblemLoading, setIsProblemLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [problemError, setProblemError] = useState<string | null>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const toastCooldownsRef = useRef<Record<string, number>>({});
  const { analysis, isDismissed, error: analysisError, dismiss } = useCodeAnalysis(
    editorCode,
    selectedProblemSlug,
  );

  useEffect(() => {
    const storedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (storedSessionId) {
      setSessionId(storedSessionId);
      return;
    }

    const nextSessionId = globalThis.crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    setSessionId(nextSessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }, [sessionId]);

  const showToast = useMemo(
    () => (message: string) => {
      const now = Date.now();
      const lastShownAt = toastCooldownsRef.current[message] ?? 0;

      if (now - lastShownAt < 5000) {
        return;
      }

      toastCooldownsRef.current[message] = now;

      const toastId = globalThis.crypto.randomUUID();
      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id: toastId,
          message,
        },
      ]);

      window.setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toast) => toast.id !== toastId),
        );
      }, 4000);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProblems() {
      setIsProblemListLoading(true);
      setProblemError(null);

      try {
        const summaries = await fetchJson<ProblemSummary[]>("/api/problems");

        if (cancelled) {
          return;
        }

        setProblems(summaries);

        if (summaries.length === 0) {
          setSelectedProblem(null);
          setSelectedProblemSlug(null);
          return;
        }

        const firstProblem = summaries[0];

        setSelectedProblemSlug(firstProblem.slug);
        setIsProblemLoading(true);

        const detail = await fetchJson<ProblemDetail>(
          `/api/problems/${firstProblem.slug}`,
        );

        if (cancelled) {
          return;
        }

        setSelectedProblem(detail);
      } catch (error) {
        if (!cancelled) {
          const message = getErrorMessage(error);
          setProblemError(message);
          showToast(message);
        }
      } finally {
        if (!cancelled) {
          setIsProblemListLoading(false);
          setIsProblemLoading(false);
        }
      }
    }

    loadProblems();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    setEditorCode(getStarterCode(selectedProblem, selectedLanguage));
  }, [selectedProblem, selectedLanguage]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;

    async function loadChatHistory() {
      try {
        const history = await fetchJson<HistoryMessage[]>(
          `/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`,
        );

        if (cancelled) {
          return;
        }

        setChatMessages(
          history.map((message) => ({
            id: `history-${message.id}`,
            role: message.role,
            content: message.content,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          showToast(getErrorMessage(error));
        }
      }
    }

    void loadChatHistory();

    return () => {
      cancelled = true;
    };
  }, [sessionId, showToast]);

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    if (analysisError) {
      showToast(analysisError);
    }
  }, [analysisError, showToast]);

  async function handleProblemSelect(slug: string) {
    if (slug === selectedProblemSlug && selectedProblem) {
      return;
    }

    setSelectedProblemSlug(slug);
    setIsProblemLoading(true);
    setProblemError(null);

    try {
      const detail = await fetchJson<ProblemDetail>(`/api/problems/${slug}`);
      setSelectedProblem(detail);
    } catch (error) {
      const message = getErrorMessage(error);
      setProblemError(message);
      showToast(message);
    } finally {
      setIsProblemLoading(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = chatInput.trim();

    if (
      !trimmedMessage ||
      !selectedProblemSlug ||
      !sessionId ||
      isChatLoading
    ) {
      return;
    }

    setChatInput("");
    setIsChatLoading(true);
    const pendingUserMessageId = globalThis.crypto.randomUUID();

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: pendingUserMessageId,
        role: "user",
        content: trimmedMessage,
      },
    ]);

    try {
      const response = await fetchJson<ChatResponse>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmedMessage,
          code: editorCode,
          problemSlug: selectedProblemSlug,
          sessionId,
        }),
      });

      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: globalThis.crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      setChatMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== pendingUserMessageId),
      );
      setChatInput(trimmedMessage);
      showToast(errorMessage);
    } finally {
      setIsChatLoading(false);
    }
  }

  function handleNewSession() {
    const nextSessionId = globalThis.crypto.randomUUID();

    setSessionId(nextSessionId);
    setChatMessages([]);
    setChatInput("");
    setEditorCode(getStarterCode(selectedProblem, selectedLanguage));
  }

  function handleChatKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") {
      return;
    }

    const isShortcutPressed = event.ctrlKey || event.metaKey;

    if (!isShortcutPressed) {
      return;
    }

    event.preventDefault();

    const form = event.currentTarget.form;
    if (form) {
      form.requestSubmit();
    }
  }

  const examples = normalizeExamples(selectedProblem?.examples);
  const shouldShowAnalysisBanner = Boolean(analysis && !isDismissed);
  const isAnalysisHealthy = analysis === "LGTM";

  return (
    <main className="flex min-h-screen flex-col bg-transparent px-4 py-4 text-foreground md:px-6">
      <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[28px] border border-border bg-panel/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur xl:min-h-[calc(100vh-3rem)]">
        <nav className="flex flex-col gap-4 border-b border-border bg-panel-strong/95 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent">
              Live Interview Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              CodeCoach
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 text-sm text-slate-200">
              <span className="text-slate-400">Language</span>
              <select
                aria-label="Programming language"
                value={selectedLanguage}
                onChange={(event) =>
                  setSelectedLanguage(event.target.value as LanguageOption)
                }
                className="rounded-xl bg-panel-strong px-3 py-2 text-sm text-white outline-none ring-0"
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleNewSession}
              className="rounded-2xl border border-border bg-panel px-5 py-3 text-sm font-semibold text-white transition hover:border-sky-400/40 hover:text-sky-200"
            >
              New Session
            </button>

            <button
              type="button"
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
            >
              Run Code
            </button>
          </div>
        </nav>

        <section className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
          <aside className="flex min-h-[280px] flex-col overflow-hidden rounded-[24px] border border-border bg-panel-strong p-5 lg:basis-1/4">
            <div className="border-b border-border pb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Problems
              </p>

              <div className="mt-4 flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
                {isProblemListLoading ? (
                  <div className="rounded-2xl border border-border bg-panel px-4 py-3 text-sm text-slate-400">
                    Loading problem set...
                  </div>
                ) : (
                  problems.map((problem) => (
                    <button
                      key={problem.slug}
                      type="button"
                      onClick={() => void handleProblemSelect(problem.slug)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        selectedProblemSlug === problem.slug
                          ? "border-sky-400/50 bg-sky-400/10"
                          : "border-border bg-panel hover:border-sky-400/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium text-white">
                          {problem.title}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${difficultyBadgeClasses(
                            problem.difficulty,
                          )}`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex-1 overflow-y-auto pr-1">
              {problemError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {problemError}
                </div>
              ) : isProblemLoading || isProblemListLoading ? (
                <div className="rounded-2xl border border-border bg-panel px-4 py-4 text-sm text-slate-400">
                  Loading selected problem...
                </div>
              ) : selectedProblem ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Problem
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">
                        {selectedProblem.title}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${difficultyBadgeClasses(
                        selectedProblem.difficulty,
                      )}`}
                    >
                      {selectedProblem.difficulty}
                    </span>
                  </div>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Description
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                      {selectedProblem.description}
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Examples
                    </h3>
                    <div className="space-y-3">
                      {examples.map((example, index) => (
                        <div
                          key={`${selectedProblem.slug}-example-${index}`}
                          className="rounded-2xl border border-border bg-panel px-4 py-4 text-sm text-slate-300"
                        >
                          <p className="font-semibold text-white">
                            Example {index + 1}
                          </p>
                          <p className="mt-3 whitespace-pre-line">
                            <span className="text-slate-500">Input:</span>{" "}
                            {example.input}
                          </p>
                          <p className="mt-2 whitespace-pre-line">
                            <span className="text-slate-500">Output:</span>{" "}
                            {example.output}
                          </p>
                          {example.explanation ? (
                            <p className="mt-2 whitespace-pre-line">
                              <span className="text-slate-500">
                                Explanation:
                              </span>{" "}
                              {example.explanation}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Constraints
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {selectedProblem.constraints.map((constraint) => (
                        <li
                          key={constraint}
                          className="rounded-2xl border border-border bg-panel px-4 py-3"
                        >
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-panel px-4 py-4 text-sm text-slate-400">
                  Pick a problem to get started.
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[420px] flex-col rounded-[24px] border border-border bg-panel-strong lg:basis-[45%]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Editor
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Solution Workspace
                </h2>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {selectedLanguage}
              </span>
            </div>
            {shouldShowAnalysisBanner ? (
              <div
                className={`flex items-center justify-between gap-3 border-b px-5 py-3 text-sm ${
                  isAnalysisHealthy
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                    : "border-amber-400/20 bg-amber-400/10 text-amber-100"
                }`}
              >
                <p className="leading-6">
                  {isAnalysisHealthy ? "✓ Looking good" : analysis}
                </p>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-lg px-2 py-1 text-base leading-none transition hover:bg-black/10"
                  aria-label="Dismiss analysis banner"
                >
                  ×
                </button>
              </div>
            ) : null}
            <div className="flex-1 overflow-hidden rounded-b-[24px]">
              <MonacoEditorPanel
                language={MONACO_LANGUAGES[selectedLanguage]}
                value={editorCode}
                onChange={setEditorCode}
              />
            </div>
          </section>

          <aside className="flex min-h-[280px] flex-col rounded-[24px] border border-border bg-panel-strong lg:basis-[30%]">
            <div className="border-b border-border px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                AI Coach
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Interview Chat
              </h2>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {chatMessages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm leading-6 text-slate-400">
                    Ask CodeCoach for hints, bug checks, or interview guidance
                    once you select a problem.
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "ml-auto rounded-tr-sm bg-accent/15 text-sky-100"
                          : "rounded-tl-sm bg-panel text-slate-300"
                      }`}
                    >
                      <ChatMessageContent content={message.content} />
                    </div>
                  ))
                )}

                {isChatLoading ? (
                  <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-panel px-4 py-3 text-sm leading-6 text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <span>CodeCoach is thinking</span>
                      <TypingDots />
                    </span>
                  </div>
                ) : null}

                <div ref={latestMessageRef} />
              </div>

              <div className="border-t border-border px-5 py-4">
                <form
                  onSubmit={(event) => void handleSendMessage(event)}
                  className="flex items-end gap-3 rounded-2xl border border-border bg-panel px-3 py-3"
                >
                  <textarea
                    aria-label="Chat input"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask CodeCoach for a hint..."
                    className="min-h-20 flex-1 resize-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                    disabled={!selectedProblemSlug || !sessionId || isChatLoading}
                  />
                  <button
                    type="submit"
                    disabled={
                      !chatInput.trim() ||
                      !selectedProblemSlug ||
                      !sessionId ||
                      isChatLoading
                    }
                    className="rounded-xl border border-border bg-panel-muted px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <div className="pointer-events-none fixed right-5 top-5 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-rose-400/20 bg-panel-strong/95 px-4 py-3 text-sm text-rose-100 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </main>
  );
}

type ChatSegment =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "code";
      content: string;
      language: string | null;
    };

function parseChatContent(content: string): ChatSegment[] {
  const pattern = /```([\w+-]+)?\n?([\s\S]*?)```/g;
  const segments: ChatSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(pattern)) {
    const fullMatch = match[0];
    const language = match[1] ?? null;
    const code = match[2] ?? "";
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        content: content.slice(lastIndex, matchIndex),
      });
    }

    segments.push({
      type: "code",
      content: code.replace(/\n$/, ""),
      language,
    });

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return segments;
}

function normalizeHighlightLanguage(language: string | null) {
  switch (language?.toLowerCase()) {
    case "js":
    case "javascript":
      return "javascript";
    case "py":
    case "python":
      return "python";
    case "java":
      return "java";
    case "cpp":
    case "c++":
    case "cc":
    case "cxx":
      return "cpp";
    default:
      return null;
  }
}

function highlightCode(content: string, language: string | null) {
  const normalizedLanguage = normalizeHighlightLanguage(language);

  if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
    return hljs.highlight(content, {
      language: normalizedLanguage,
    }).value;
  }

  return hljs.highlightAuto(content).value;
}

function ChatMessageContent({
  content,
}: {
  content: string;
}) {
  const segments = parseChatContent(content);

  return (
    <div className="space-y-3">
      {segments.map((segment, index) =>
        segment.type === "text" ? (
          <p
            key={`text-${index}`}
            className="whitespace-pre-wrap break-words"
          >
            {segment.content}
          </p>
        ) : (
          <pre
            key={`code-${index}`}
            className="overflow-x-auto rounded-xl border border-border bg-[#0a1020] px-4 py-3 text-[13px] leading-6 text-slate-100"
          >
            <code
              className="hljs"
              dangerouslySetInnerHTML={{
                __html: highlightCode(segment.content, segment.language),
              }}
            />
          </pre>
        ),
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="inline-block animate-pulse text-slate-300"
          style={{
            animationDelay: `${index * 0.18}s`,
          }}
        >
          .
        </span>
      ))}
    </span>
  );
}
