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

type AuthUser = {
  id: string;
  email: string;
};

type AuthSessionResponse = {
  user: AuthUser | null;
  solvedProblemSlugs: string[];
};

type AuthMode = "login" | "register";

type SolveState = {
  saved: boolean;
  newlySolved: boolean;
  alreadySolved: boolean;
  requiresLogin: boolean;
};

type RunCaseResult = {
  id: number;
  inputSummary: string;
  expectedSummary: string;
  actualSummary: string;
  passed: boolean;
  explanation: string | null;
};

type RunResponse = {
  status: "accepted" | "wrong-answer" | "runtime-error" | "compile-error";
  summary: string;
  cases: RunCaseResult[];
  stderr?: string | null;
  stdout?: string | null;
  solveState?: SolveState;
};

type SolvedModalState = {
  title: string;
  requiresLogin: boolean;
  saved: boolean;
};

type RunErrorDisplay = {
  title: string;
  message: string;
  details: string | null;
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
const SESSION_LANGUAGE_STORAGE_PREFIX = "codecoach-session-language";
const EDITOR_DRAFT_STORAGE_PREFIX = "codecoach-editor-draft";

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

function runStatusClasses(status: RunResponse["status"]) {
  switch (status) {
    case "accepted":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "wrong-answer":
      return "border-amber-400/20 bg-amber-400/10 text-amber-100";
    case "runtime-error":
    case "compile-error":
      return "border-rose-400/20 bg-rose-400/10 text-rose-100";
    default:
      return "border-border bg-panel text-slate-200";
  }
}

function panelToggleButtonClasses(isActive: boolean) {
  return `rounded-xl border px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
      : "border-border bg-panel text-slate-300 hover:border-sky-400/30 hover:text-sky-100"
  }`;
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
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();
  const trimmedBody = rawBody.trim();
  const looksLikeHtml =
    contentType.includes("text/html") ||
    trimmedBody.startsWith("<!DOCTYPE html") ||
    trimmedBody.startsWith("<html");
  let json:
    | T
    | {
        error?: string;
      }
    | null = null;

  if (rawBody && contentType.includes("application/json")) {
    try {
      json = JSON.parse(rawBody) as
        | T
        | {
            error?: string;
          };
    } catch {
      if (response.ok) {
        throw new Error("The server returned an invalid response.");
      }
    }
  }

  if (!response.ok) {
    const errorMessage =
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof json.error === "string"
        ? json.error
        : looksLikeHtml
          ? "The server returned an unexpected error. Please refresh the app and try again."
          : rawBody || `Request failed with status ${response.status}.`;

    throw new Error(errorMessage);
  }

  if (!json) {
    throw new Error("The server returned an empty response.");
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

function getEditorDraftStorageKey(
  sessionId: string,
  problemSlug: string,
  language: LanguageOption,
) {
  return `${EDITOR_DRAFT_STORAGE_PREFIX}:${sessionId}:${problemSlug}:${language}`;
}

function getSessionLanguageStorageKey(sessionId: string) {
  return `${SESSION_LANGUAGE_STORAGE_PREFIX}:${sessionId}`;
}

function getExpectedEntryPoint(
  problemSlug: string | null,
  language: LanguageOption,
) {
  if (!problemSlug) {
    return "the starter function";
  }

  switch (problemSlug) {
    case "two-sum":
      switch (language) {
        case "Python":
          return "`two_sum(nums, target)` or `Solution.two_sum(...)`";
        case "JavaScript":
          return "`twoSum(nums, target)` or `Solution.twoSum(...)`";
        case "Java":
          return "`Solution.twoSum(int[] nums, int target)`";
        case "C++":
          return "`Solution::twoSum(vector<int>& nums, int target)`";
      }
    case "valid-parentheses":
      switch (language) {
        case "Python":
          return "`is_valid(s)` or `Solution.is_valid(...)`";
        case "JavaScript":
          return "`isValid(s)` or `Solution.isValid(...)`";
        case "Java":
          return "`Solution.isValid(String s)`";
        case "C++":
          return "`Solution::isValid(string s)`";
      }
    case "best-time-to-buy-and-sell-stock":
      switch (language) {
        case "Python":
          return "`max_profit(prices)` or `Solution.max_profit(...)`";
        case "JavaScript":
          return "`maxProfit(prices)` or `Solution.maxProfit(...)`";
        case "Java":
          return "`Solution.maxProfit(int[] prices)`";
        case "C++":
          return "`Solution::maxProfit(vector<int>& prices)`";
      }
    default:
      return "the starter function";
  }
}

function sanitizeRunnerDetails(details: string) {
  return details
    .replace(/\/private\/var\/folders\/[^\s:)]*/g, "[temporary-file]")
    .replace(/\/var\/folders\/[^\s:)]*/g, "[temporary-file]")
    .replace(/codecoach-run-[^\s/)]*/g, "codecoach-run")
    .trim();
}

function getRunErrorDisplay(
  runResult: RunResponse | null,
  problemSlug: string | null,
  problemTitle: string | undefined,
  language: LanguageOption,
): RunErrorDisplay | null {
  if (
    !runResult ||
    (runResult.status !== "runtime-error" &&
      runResult.status !== "compile-error")
  ) {
    return null;
  }

  const cleanedDetails = runResult.stderr
    ? sanitizeRunnerDetails(runResult.stderr)
    : null;
  const expectedEntryPoint = getExpectedEntryPoint(problemSlug, language);
  const activeProblemLabel = problemTitle ?? "this problem";

  if (
    cleanedDetails &&
    /Expected the starter function or a Solution method to be defined/i.test(
      cleanedDetails,
    )
  ) {
    return {
      title: "Entry point not found",
      message: `CodeCoach could not find the expected function for ${activeProblemLabel}. In ${language}, define ${expectedEntryPoint}.`,
      details: cleanedDetails,
    };
  }

  if (
    cleanedDetails &&
    /is not installed or not available on this machine/i.test(cleanedDetails)
  ) {
    return {
      title: "Local runtime unavailable",
      message: `The ${language} toolchain is not available on this machine yet, so CodeCoach could not execute your solution locally.`,
      details: cleanedDetails,
    };
  }

  if (runResult.status === "compile-error") {
    return {
      title: "Compilation failed",
      message:
        "CodeCoach found a compile-time issue before the test cases could run. Fix the syntax or type error, then run again.",
      details: cleanedDetails,
    };
  }

  return {
    title: "Runtime error",
    message:
      "Your code started running but exited before the visible test cases could finish. Open the runner details below if you want the full trace.",
    details: cleanedDetails,
  };
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
  const [editorDraftKey, setEditorDraftKey] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [solvedProblemSlugs, setSolvedProblemSlugs] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [solvedModalState, setSolvedModalState] =
    useState<SolvedModalState | null>(null);
  const [isProblemListLoading, setIsProblemListLoading] = useState(true);
  const [isProblemLoading, setIsProblemLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRunLoading, setIsRunLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProblemPanelOpen, setIsProblemPanelOpen] = useState(true);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  const [isRunResultsOpen, setIsRunResultsOpen] = useState(true);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [isRunErrorDetailsOpen, setIsRunErrorDetailsOpen] = useState(false);
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

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const storedLanguage = window.localStorage.getItem(
      getSessionLanguageStorageKey(sessionId),
    );

    if (
      storedLanguage &&
      LANGUAGE_OPTIONS.includes(storedLanguage as LanguageOption)
    ) {
      setSelectedLanguage(storedLanguage as LanguageOption);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    window.localStorage.setItem(
      getSessionLanguageStorageKey(sessionId),
      selectedLanguage,
    );
  }, [selectedLanguage, sessionId]);

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

    async function loadAuthSession() {
      try {
        const authSession = await fetchJson<AuthSessionResponse>(
          "/api/auth/session",
        );

        if (cancelled) {
          return;
        }

        setAuthUser(authSession.user);
        setSolvedProblemSlugs(authSession.solvedProblemSlugs);
      } catch (error) {
        if (!cancelled) {
          showToast(getErrorMessage(error));
        }
      }
    }

    void loadAuthSession();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

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
    if (!sessionId || !selectedProblemSlug || !selectedProblem) {
      setEditorDraftKey(null);
      setEditorCode(getStarterCode(selectedProblem, selectedLanguage));
      return;
    }

    const nextDraftKey = getEditorDraftStorageKey(
      sessionId,
      selectedProblemSlug,
      selectedLanguage,
    );
    const storedDraft = window.localStorage.getItem(nextDraftKey);

    setEditorDraftKey(nextDraftKey);
    setEditorCode(storedDraft ?? getStarterCode(selectedProblem, selectedLanguage));
  }, [sessionId, selectedProblem, selectedProblemSlug, selectedLanguage]);

  useEffect(() => {
    if (!editorDraftKey) {
      return;
    }

    window.localStorage.setItem(editorDraftKey, editorCode);
  }, [editorCode, editorDraftKey]);

  useEffect(() => {
    setRunResult(null);
  }, [selectedProblemSlug, selectedLanguage]);

  useEffect(() => {
    setIsRunErrorDetailsOpen(false);
  }, [runResult?.status, runResult?.summary, runResult?.stderr]);

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

  useEffect(() => {
    const url = new URL(window.location.href);
    const authErrorMessage = url.searchParams.get("authError");

    if (!authErrorMessage) {
      return;
    }

    setAuthMode("login");
    setAuthError(authErrorMessage);
    setIsAuthModalOpen(true);
    showToast(authErrorMessage);

    url.searchParams.delete("authError");
    window.history.replaceState({}, "", url.toString());
  }, [showToast]);

  useEffect(() => {
    if (!isEditorFocused) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsEditorFocused(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditorFocused]);

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

      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${pendingUserMessageId}-error`,
          role: "assistant",
          content: errorMessage,
        },
      ]);
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
    setRunResult(null);
  }

  function handleEditorFocusToggle() {
    setIsEditorFocused((currentValue) => !currentValue);
  }

  async function saveSolvedProblem(problemSlug: string) {
    const solveState = await fetchJson<SolveState>("/api/solved", {
      method: "POST",
      body: JSON.stringify({
        problemSlug,
      }),
    });

    setSolvedProblemSlugs((currentSlugs) =>
      currentSlugs.includes(problemSlug)
        ? currentSlugs
        : [...currentSlugs, problemSlug],
    );

    return solveState;
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = authEmail.trim();
    const trimmedPassword = authPassword.trim();

    if (!trimmedEmail || !trimmedPassword || isAuthLoading) {
      return;
    }

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const authSession = await fetchJson<AuthSessionResponse>(
        `/api/auth/${authMode}`,
        {
          method: "POST",
          body: JSON.stringify({
            email: trimmedEmail,
            password: trimmedPassword,
          }),
        },
      );

      setAuthUser(authSession.user);
      setSolvedProblemSlugs(authSession.solvedProblemSlugs);
      setIsAuthModalOpen(false);
      setAuthPassword("");

      if (
        selectedProblemSlug &&
        runResult?.status === "accepted" &&
        runResult.solveState?.requiresLogin
      ) {
        const solveState = await saveSolvedProblem(selectedProblemSlug);

        if (solveState.newlySolved && selectedProblem) {
          setSolvedModalState({
            title: selectedProblem.title,
            requiresLogin: false,
            saved: true,
          });
        }

        setRunResult((currentResult) =>
          currentResult
            ? {
                ...currentResult,
                solveState,
              }
            : currentResult,
        );
      }
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (isAuthLoading) {
      return;
    }

    setIsAuthLoading(true);

    try {
      await fetchJson<{ success: true }>("/api/auth/logout", {
        method: "POST",
      });

      setAuthUser(null);
      setSolvedProblemSlugs([]);
      setSolvedModalState(null);
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setIsAuthLoading(false);
    }
  }

  function handleGoogleAuth() {
    if (isAuthLoading) {
      return;
    }

    window.location.assign("/api/auth/google");
  }

  async function handleRunCode() {
    if (!selectedProblemSlug || !editorCode.trim() || isRunLoading) {
      return;
    }

    setIsRunLoading(true);

    try {
      const result = await fetchJson<RunResponse>("/api/run", {
        method: "POST",
        body: JSON.stringify({
          code: editorCode,
          problemSlug: selectedProblemSlug,
          language: selectedLanguage,
        }),
      });

      setRunResult(result);

      if (
        result.status === "accepted" &&
        selectedProblem &&
        result.solveState
      ) {
        if (result.solveState.saved) {
          setSolvedProblemSlugs((currentSlugs) =>
            currentSlugs.includes(selectedProblem.slug)
              ? currentSlugs
              : [...currentSlugs, selectedProblem.slug],
          );

          if (result.solveState.newlySolved) {
            setSolvedModalState({
              title: selectedProblem.title,
              requiresLogin: false,
              saved: true,
            });
          }
        } else if (result.solveState.requiresLogin) {
          setSolvedModalState({
            title: selectedProblem.title,
            requiresLogin: true,
            saved: false,
          });
        }
      }
    } catch (error) {
      const message = getErrorMessage(error);
      showToast(message);
    } finally {
      setIsRunLoading(false);
    }
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
  const runErrorDisplay = getRunErrorDisplay(
    runResult,
    selectedProblemSlug,
    selectedProblem?.title,
    selectedLanguage,
  );
  const isCurrentProblemSolved = selectedProblemSlug
    ? solvedProblemSlugs.includes(selectedProblemSlug)
    : false;
  const visibleSidePanels = Number(!isEditorFocused && isProblemPanelOpen) +
    Number(!isEditorFocused && isChatPanelOpen);
  const editorPanelWidthClass = isEditorFocused
    ? "xl:basis-full"
    : visibleSidePanels === 2
      ? "xl:basis-[45%]"
      : visibleSidePanels === 1
        ? "xl:basis-[70%]"
        : "xl:basis-full";

  return (
    <main className="flex min-h-screen flex-col bg-transparent px-3 py-3 text-foreground sm:px-4 sm:py-4 md:px-6 xl:h-dvh xl:overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-border bg-panel/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur xl:min-h-0">
        <nav className="grid gap-3 border-b border-border bg-panel-strong/95 px-4 py-3 sm:px-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.35em] text-accent">
              Live Interview Workspace
            </p>
            <h1 className="mt-1 text-[2rem] font-semibold tracking-tight text-white sm:text-2xl">
              CodeCoach
            </h1>
          </div>

          <div className="flex min-w-0 flex-col gap-2 xl:max-w-[920px] xl:items-end">
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button
                type="button"
                onClick={() => setIsProblemPanelOpen((currentValue) => !currentValue)}
                className={panelToggleButtonClasses(
                  isProblemPanelOpen && !isEditorFocused,
                )}
                aria-pressed={isProblemPanelOpen && !isEditorFocused}
              >
                {isProblemPanelOpen && !isEditorFocused
                  ? "Hide Problems"
                  : "Show Problems"}
              </button>

              <button
                type="button"
                onClick={() => setIsChatPanelOpen((currentValue) => !currentValue)}
                className={panelToggleButtonClasses(
                  isChatPanelOpen && !isEditorFocused,
                )}
                aria-pressed={isChatPanelOpen && !isEditorFocused}
              >
                {isChatPanelOpen && !isEditorFocused ? "Hide Chat" : "Show Chat"}
              </button>

              <button
                type="button"
                onClick={() => setIsRunResultsOpen((currentValue) => !currentValue)}
                className={panelToggleButtonClasses(isRunResultsOpen)}
                aria-pressed={isRunResultsOpen}
              >
                {isRunResultsOpen ? "Hide Results" : "Show Results"}
              </button>

              <button
                type="button"
                onClick={handleEditorFocusToggle}
                className={panelToggleButtonClasses(isEditorFocused)}
                aria-pressed={isEditorFocused}
              >
                {isEditorFocused ? "Exit Focus" : "Focus Editor"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <label className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-panel px-3 py-2 text-sm text-slate-200 sm:min-w-[260px]">
                <span className="shrink-0 text-slate-400">Language</span>
                <select
                  aria-label="Programming language"
                  value={selectedLanguage}
                  onChange={(event) =>
                    setSelectedLanguage(event.target.value as LanguageOption)
                  }
                  className="min-w-0 flex-1 rounded-lg bg-panel-strong px-3 py-1.5 text-sm text-white outline-none ring-0"
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
                className="rounded-xl border border-border bg-panel px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/40 hover:text-sky-200"
              >
                New Session
              </button>

              <button
                type="button"
                onClick={() => void handleRunCode()}
                disabled={!selectedProblemSlug || !editorCode.trim() || isRunLoading}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:opacity-60"
              >
                {isRunLoading ? "Running..." : "Run Code"}
              </button>

              {authUser ? (
                <>
                  <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                    {authUser.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={isAuthLoading}
                    className="rounded-xl border border-border bg-panel px-3 py-2 text-sm font-semibold text-white transition hover:border-sky-400/40 hover:text-sky-200 disabled:opacity-60"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError(null);
                    setIsAuthModalOpen(true);
                  }}
                  className="rounded-xl border border-border bg-panel px-3 py-2 text-sm font-semibold text-white transition hover:border-sky-400/40 hover:text-sky-200"
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        </nav>

        <section className="flex flex-1 flex-col gap-4 p-3 sm:p-4 xl:min-h-0 xl:flex-row">
          {!isEditorFocused && isProblemPanelOpen ? (
          <aside className="flex min-h-[320px] flex-col overflow-hidden rounded-[24px] border border-border bg-panel-strong p-4 sm:p-5 xl:min-h-0 xl:basis-1/4 xl:min-w-0">
            <div className="border-b border-border pb-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Problems
                </p>
                <button
                  type="button"
                  onClick={() => setIsProblemPanelOpen(false)}
                  className="rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-sky-400/30 hover:text-sky-100"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex max-h-52 flex-col gap-2 overflow-y-auto pr-1 sm:max-h-60 xl:max-h-52">
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
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="block min-w-0 break-words text-sm font-medium text-white">
                            {problem.title}
                          </span>
                          {solvedProblemSlugs.includes(problem.slug) ? (
                            <span className="mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                              Solved
                            </span>
                          ) : null}
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${difficultyBadgeClasses(
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

            <div className="mt-5 pr-1 xl:flex-1 xl:overflow-y-auto">
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
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Problem
                      </p>
                      <h2 className="mt-2 break-words text-lg font-semibold text-white">
                        {selectedProblem.title}
                      </h2>
                      {isCurrentProblemSolved ? (
                        <span className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          Solved
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${difficultyBadgeClasses(
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
                          <p className="mt-3 break-words whitespace-pre-line">
                            <span className="text-slate-500">Input:</span>{" "}
                            {example.input}
                          </p>
                          <p className="mt-2 break-words whitespace-pre-line">
                            <span className="text-slate-500">Output:</span>{" "}
                            {example.output}
                          </p>
                          {example.explanation ? (
                            <p className="mt-2 break-words whitespace-pre-line">
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
                          className="break-words rounded-2xl border border-border bg-panel px-4 py-3"
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
          ) : null}

          <section
            className={`flex min-h-[420px] flex-col rounded-[24px] border border-border bg-panel-strong xl:min-h-0 xl:min-w-0 ${editorPanelWidthClass}`}
          >
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:px-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Editor
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Solution Workspace
                </h2>
                {isEditorFocused ? (
                  <p className="mt-1 text-sm text-slate-400">
                    Focus mode is on. Press Esc to exit.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRunResultsOpen((currentValue) => !currentValue)}
                  className="rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-sky-400/30 hover:text-sky-100"
                >
                  {isRunResultsOpen ? "Hide Results" : "Show Results"}
                </button>
                <button
                  type="button"
                  onClick={handleEditorFocusToggle}
                  className="rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-sky-400/30 hover:text-sky-100"
                >
                  {isEditorFocused ? "Exit Focus" : "Expand"}
                </button>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {selectedLanguage}
                </span>
              </div>
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
            <div className="flex flex-1 flex-col xl:min-h-0">
              <div className="h-[320px] overflow-hidden sm:h-[420px] xl:min-h-0 xl:flex-1 xl:h-auto">
                <MonacoEditorPanel
                  language={MONACO_LANGUAGES[selectedLanguage]}
                  value={editorCode}
                  onChange={setEditorCode}
                />
              </div>

              {isRunResultsOpen ? (
              <div className="border-t border-border bg-panel px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      Run Results
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Executes the visible example cases through the configured
                      runner.
                    </p>
                  </div>
                  {runResult ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${runStatusClasses(
                        runResult.status,
                      )}`}
                    >
                      {runResult.status.replace("-", " ")}
                    </span>
                  ) : null}
                </div>

                {runResult ? (
                  <div className="mt-4 space-y-3">
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${runStatusClasses(
                        runResult.status,
                      )}`}
                    >
                      {runResult.summary}
                    </div>

                    {runErrorDisplay ? (
                      <div className="rounded-2xl border border-rose-400/20 bg-[#180d15] px-4 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-rose-50">
                              {runErrorDisplay.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-rose-100/90">
                              {runErrorDisplay.message}
                            </p>
                          </div>
                          {runErrorDisplay.details ? (
                            <button
                              type="button"
                              onClick={() =>
                                setIsRunErrorDetailsOpen((currentValue) => !currentValue)
                              }
                              className="shrink-0 rounded-xl border border-rose-400/20 bg-rose-400/5 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:border-rose-300/30 hover:bg-rose-400/10"
                            >
                              {isRunErrorDetailsOpen
                                ? "Hide details"
                                : "Show details"}
                            </button>
                          ) : null}
                        </div>

                        {runErrorDisplay.details && isRunErrorDetailsOpen ? (
                          <div className="mt-4 overflow-hidden rounded-xl border border-rose-400/15 bg-black/20">
                            <div className="border-b border-rose-400/10 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-rose-200/80">
                              Runner details
                            </div>
                            <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all px-4 py-3 text-xs leading-6 text-rose-100/90">
                              {runErrorDisplay.details}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {runResult.cases.length > 0 ? (
                      <div className="max-h-60 space-y-3 overflow-y-auto pr-1 xl:max-h-52">
                        {runResult.cases.map((testCase, index) => (
                          <div
                            key={testCase.id}
                            className={`rounded-2xl border px-4 py-3 text-sm ${
                              testCase.passed
                                ? "border-emerald-400/20 bg-emerald-400/10"
                                : "border-amber-400/20 bg-amber-400/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-white">
                                Case {index + 1}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  testCase.passed
                                    ? "bg-emerald-400/15 text-emerald-200"
                                    : "bg-amber-400/15 text-amber-100"
                                }`}
                              >
                                {testCase.passed ? "Passed" : "Failed"}
                              </span>
                            </div>
                            <p className="mt-3 break-words text-slate-300">
                              <span className="text-slate-500">Input:</span>{" "}
                              {testCase.inputSummary}
                            </p>
                            <p className="mt-2 break-words text-slate-300">
                              <span className="text-slate-500">Expected:</span>{" "}
                              {testCase.expectedSummary}
                            </p>
                            <p className="mt-2 break-words text-slate-300">
                              <span className="text-slate-500">Actual:</span>{" "}
                              {testCase.actualSummary}
                            </p>
                            {testCase.explanation ? (
                              <p className="mt-2 break-words text-slate-400">
                                {testCase.explanation}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-slate-400">
                    Run your code to see how it performs on the visible test
                    cases for this problem.
                  </div>
                )}
              </div>
              ) : (
                <div className="border-t border-border bg-panel px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setIsRunResultsOpen(true)}
                    className="text-sm font-medium text-slate-400 transition hover:text-sky-200"
                  >
                    Show run results
                  </button>
                </div>
              )}
            </div>
          </section>

          {!isEditorFocused && isChatPanelOpen ? (
          <aside className="flex min-h-[320px] flex-col rounded-[24px] border border-border bg-panel-strong xl:min-h-0 xl:basis-[30%] xl:min-w-0">
            <div className="border-b border-border px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    AI Coach
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    Interview Chat
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatPanelOpen(false)}
                  className="rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-sky-400/30 hover:text-sky-100"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col xl:overflow-hidden">
              <div className="max-h-[360px] space-y-4 overflow-y-auto px-4 py-5 sm:px-5 xl:max-h-none xl:flex-1">
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

              <div className="border-t border-border px-4 py-4 sm:px-5">
                <form
                  onSubmit={(event) => void handleSendMessage(event)}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-panel px-3 py-3 sm:flex-row sm:items-end"
                >
                  <textarea
                    aria-label="Chat input"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask CodeCoach for a hint..."
                    className="min-h-20 w-full flex-1 resize-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
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
                    className="w-full rounded-xl border border-border bg-panel-muted px-4 py-2 text-sm font-medium text-white transition hover:border-sky-400/40 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </aside>
          ) : null}
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

      {isAuthModalOpen ? (
        <ModalShell
          title={authMode === "login" ? "Welcome back" : "Create your account"}
          description={
            authMode === "login"
              ? "Log in to sync solved problems across sessions."
              : "Create a simple account to save solved problems."
          }
          onClose={() => {
            if (isAuthLoading) {
              return;
            }

            setIsAuthModalOpen(false);
            setAuthError(null);
          }}
        >
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isAuthLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-400/40 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-950">
                G
              </span>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-500">
              <span className="h-px flex-1 bg-border" />
              <span>Or use email</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={(event) => void handleAuthSubmit(event)} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                className="w-full rounded-2xl border border-border bg-panel px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/40"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                className="w-full rounded-2xl border border-border bg-panel px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/40"
                placeholder="At least 8 characters"
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
              />
            </div>

            {authError ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {authError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setAuthMode((currentMode) =>
                    currentMode === "login" ? "register" : "login",
                  );
                  setAuthError(null);
                }}
                className="text-sm font-medium text-sky-200 transition hover:text-sky-100"
              >
                {authMode === "login"
                  ? "Need an account? Sign up"
                  : "Already have an account? Log in"}
              </button>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:opacity-60"
              >
                {isAuthLoading
                  ? authMode === "login"
                    ? "Logging in..."
                    : "Creating account..."
                  : authMode === "login"
                    ? "Log In"
                    : "Create Account"}
              </button>
            </div>
            </form>
          </div>
        </ModalShell>
      ) : null}

      {solvedModalState ? (
        <ModalShell
          title={solvedModalState.saved ? "Problem solved" : "Accepted locally"}
          description={
            solvedModalState.saved
              ? `${solvedModalState.title} was saved to your CodeCoach progress.`
              : `${solvedModalState.title} passed the visible test cases.`
          }
          onClose={() => setSolvedModalState(null)}
        >
          <div className="space-y-4">
            <div className="rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_55%),linear-gradient(180deg,rgba(16,185,129,0.12),rgba(5,8,22,0.5))] px-5 py-5">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">
                Nice work
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {solvedModalState.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {solvedModalState.saved
                  ? "Your progress is now attached to your account, so the solved badge will follow you across sessions."
                  : "Log in or create an account to keep a permanent record of solved problems."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {solvedModalState.requiresLogin ? (
                <button
                  type="button"
                  onClick={() => {
                    setSolvedModalState(null);
                    setAuthMode("login");
                    setAuthError(null);
                    setIsAuthModalOpen(true);
                  }}
                  className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                >
                  Log In To Save
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSolvedModalState(null)}
                className="rounded-2xl border border-border bg-panel px-5 py-3 text-sm font-semibold text-white transition hover:border-sky-400/40 hover:text-sky-200"
              >
                Keep Coding
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </main>
  );
}

function ModalShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#020611]/80 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[32px] border border-border bg-panel-strong/95 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-border bg-panel px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:border-sky-400/30 hover:text-sky-100"
          aria-label="Close dialog"
        >
          Close
        </button>

        <div className="pr-16">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">
            CodeCoach
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
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
