import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type ExecutionLanguage = "Python" | "JavaScript" | "Java" | "C++";

export type ProblemSlug =
  | "two-sum"
  | "valid-parentheses"
  | "best-time-to-buy-and-sell-stock";

export type StoredTestCase = {
  id: number;
  input: unknown;
  expected: unknown;
  explanation: string | null;
  isHidden?: boolean;
  sortOrder?: number;
};

export type RunCaseResult = {
  id: number;
  inputSummary: string;
  expectedSummary: string;
  actualSummary: string;
  passed: boolean;
  explanation: string | null;
};

export type RunStatus =
  | "accepted"
  | "wrong-answer"
  | "runtime-error"
  | "compile-error";

export type RunResponsePayload = {
  status: RunStatus;
  summary: string;
  cases: RunCaseResult[];
  stderr?: string | null;
  stdout?: string | null;
  solveState?: {
    saved: boolean;
    newlySolved: boolean;
    alreadySolved: boolean;
    requiresLogin: boolean;
  };
};

type PistonExecutionResult = {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
  };
};

type LocalCommandResult = PistonExecutionResult["run"];

type SupportedProblemConfig = {
  buildProgram: (
    language: ExecutionLanguage,
    userCode: string,
    testCases: StoredTestCase[],
  ) => string;
  compare: (
    actual: unknown,
    expected: unknown,
    input: unknown,
  ) => boolean;
  summarizeInput: (input: unknown) => string;
};

const DEFAULT_PISTON_API_URL = "http://127.0.0.1:2000/api/v2";
const PISTON_SETUP_COMMAND =
  "docker run --platform linux/amd64 --privileged -dit -v ~/piston-data:/piston -p 2000:2000 --name piston_api ghcr.io/engineer-man/piston";
const PISTON_TIMEOUT_MS = 3000;
const LOCAL_EXECUTION_TIMEOUT_MS = 3000;

const CODE_RUNNER_PROVIDER =
  process.env.CODE_RUNNER_PROVIDER?.trim().toLowerCase() || "auto";

const PISTON_API_URL =
  process.env.PISTON_API_URL?.trim() || DEFAULT_PISTON_API_URL;

const RESULT_START = "__CODECOACH_RESULT_START__";
const RESULT_END = "__CODECOACH_RESULT_END__";

const PISTON_LANGUAGE_CONFIG: Record<
  ExecutionLanguage,
  {
    language: string;
    version: string;
    fileName: string;
  }
> = {
  Python: {
    language: "python",
    version: "*",
    fileName: "main.py",
  },
  JavaScript: {
    language: "javascript",
    version: "*",
    fileName: "main.js",
  },
  Java: {
    language: "java",
    version: "*",
    fileName: "Main.java",
  },
  "C++": {
    language: "c++",
    version: "*",
    fileName: "main.cpp",
  },
};

function asObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected an object-shaped test case input.");
  }

  return value as Record<string, unknown>;
}

function asNumberArray(value: unknown) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "number")) {
    throw new Error("Expected an array of numbers.");
  }

  return value as number[];
}

function asNumber(value: unknown) {
  if (typeof value !== "number") {
    throw new Error("Expected a numeric result.");
  }

  return value;
}

function asString(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("Expected a string input.");
  }

  return value;
}

function escapePythonString(value: string) {
  return JSON.stringify(value);
}

function escapeJavaOrCppString(value: string) {
  return JSON.stringify(value);
}

function toJavaIntArrayLiteral(values: number[]) {
  return `new int[]{${values.join(", ")}}`;
}

function toCppVectorLiteral(values: number[]) {
  return `{${values.join(", ")}}`;
}

function normalizeNumberArray(value: unknown) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "number")) {
    return null;
  }

  return [...value].sort((left, right) => left - right);
}

function deepEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function renderValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === "string" ? serialized : String(value);
}

function summarizeTwoSumInput(input: unknown) {
  const data = asObject(input);
  return `nums = ${JSON.stringify(data.nums)}, target = ${data.target}`;
}

function summarizeValidParenthesesInput(input: unknown) {
  const data = asObject(input);
  return `s = ${JSON.stringify(data.s)}`;
}

function summarizeStockInput(input: unknown) {
  const data = asObject(input);
  return `prices = ${JSON.stringify(data.prices)}`;
}

function compareTwoSum(actual: unknown, expected: unknown) {
  const normalizedActual = normalizeNumberArray(actual);
  const normalizedExpected = normalizeNumberArray(expected);

  return (
    normalizedActual !== null &&
    normalizedExpected !== null &&
    deepEqual(normalizedActual, normalizedExpected)
  );
}

function compareBoolean(actual: unknown, expected: unknown) {
  return typeof actual === "boolean" && typeof expected === "boolean"
    ? actual === expected
    : false;
}

function compareNumber(actual: unknown, expected: unknown) {
  return typeof actual === "number" && typeof expected === "number"
    ? actual === expected
    : false;
}

function buildPythonProgram(
  problemSlug: ProblemSlug,
  userCode: string,
  testCases: StoredTestCase[],
) {
  const callNameMap: Record<
    ProblemSlug,
    {
      primary: string;
      alternates: string[];
    }
  > = {
    "two-sum": {
      primary: "two_sum",
      alternates: ["twoSum"],
    },
    "valid-parentheses": {
      primary: "is_valid",
      alternates: ["isValid"],
    },
    "best-time-to-buy-and-sell-stock": {
      primary: "max_profit",
      alternates: ["maxProfit"],
    },
  };

  const callName = callNameMap[problemSlug];

  const invocationLines = testCases.map((testCase) => {
    const input = asObject(testCase.input);

    switch (problemSlug) {
      case "two-sum": {
        const nums = JSON.stringify(asNumberArray(input.nums));
        const target = asNumber(input.target);
        return `results.append(_codecoach_call(${nums}, ${target}))`;
      }
      case "valid-parentheses": {
        const s = escapePythonString(asString(input.s));
        return `results.append(_codecoach_call(${s}))`;
      }
      case "best-time-to-buy-and-sell-stock": {
        const prices = JSON.stringify(asNumberArray(input.prices));
        return `results.append(_codecoach_call(${prices}))`;
      }
    }
  });

  const solutionInvocationArgs =
    problemSlug === "two-sum"
      ? "first_arg, second_arg"
      : "first_arg";

  const solutionMethodAlternates = callName.alternates
    .map(
      (methodName) => `
    if hasattr(solution, "${methodName}"):
        return solution.${methodName}(${solutionInvocationArgs})`,
    )
    .join("");

  return [
    "import json",
    userCode,
    "",
    "def _codecoach_call(first_arg, second_arg=None):",
    `    if "${callName.primary}" in globals() and callable(globals()["${callName.primary}"]):`,
    `        return globals()["${callName.primary}"](${solutionInvocationArgs})`,
    '    if "Solution" in globals():',
    "        solution = Solution()",
    `        if hasattr(solution, "${callName.primary}"):`,
    `            return solution.${callName.primary}(${solutionInvocationArgs})`,
    solutionMethodAlternates,
    '    raise NameError("Expected the starter function or a Solution method to be defined.")',
    "",
    "results = []",
    ...invocationLines,
    `print("${RESULT_START}")`,
    "print(json.dumps(results))",
    `print("${RESULT_END}")`,
    "",
  ].join("\n");
}

function buildJavaScriptProgram(
  problemSlug: ProblemSlug,
  userCode: string,
  testCases: StoredTestCase[],
) {
  const invocationLines = testCases.map((testCase) => {
    const input = asObject(testCase.input);

    switch (problemSlug) {
      case "two-sum":
        return `results.push(_codecoachCall(${JSON.stringify(
          asNumberArray(input.nums),
        )}, ${asNumber(input.target)}));`;
      case "valid-parentheses":
        return `results.push(_codecoachCall(${JSON.stringify(
          asString(input.s),
        )}));`;
      case "best-time-to-buy-and-sell-stock":
        return `results.push(_codecoachCall(${JSON.stringify(
          asNumberArray(input.prices),
        )}));`;
    }
  });

  const fnName =
    problemSlug === "two-sum"
      ? "twoSum"
      : problemSlug === "valid-parentheses"
        ? "isValid"
        : "maxProfit";

  const alternateFnName =
    problemSlug === "two-sum"
      ? "two_sum"
      : problemSlug === "valid-parentheses"
        ? "is_valid"
        : "max_profit";

  return [
    userCode,
    "",
    "function _codecoachCall(firstArg, secondArg) {",
    `  if (typeof ${fnName} === "function") {`,
    "    return secondArg === undefined ? " +
      `${fnName}(firstArg) : ${fnName}(firstArg, secondArg);`,
    "  }",
    `  if (typeof ${alternateFnName} === "function") {`,
    "    return secondArg === undefined ? " +
      `${alternateFnName}(firstArg) : ${alternateFnName}(firstArg, secondArg);`,
    "  }",
    '  if (typeof Solution === "function") {',
    "    const solution = new Solution();",
    `    if (typeof solution.${fnName} === "function") {`,
    `      return secondArg === undefined ? solution.${fnName}(firstArg) : solution.${fnName}(firstArg, secondArg);`,
    "    }",
    `    if (typeof solution.${alternateFnName} === "function") {`,
    `      return secondArg === undefined ? solution.${alternateFnName}(firstArg) : solution.${alternateFnName}(firstArg, secondArg);`,
    "    }",
    "  }",
    '  throw new Error("Expected the starter function or a Solution method to be defined.");',
    "}",
    "",
    "const results = [];",
    ...invocationLines,
    `console.log("${RESULT_START}");`,
    "console.log(JSON.stringify(results));",
    `console.log("${RESULT_END}");`,
    "",
  ].join("\n");
}

function buildJavaProgram(
  problemSlug: ProblemSlug,
  userCode: string,
  testCases: StoredTestCase[],
) {
  const methodName =
    problemSlug === "two-sum"
      ? "twoSum"
      : problemSlug === "valid-parentheses"
        ? "isValid"
        : "maxProfit";

  const invocationLines = testCases.map((testCase, index) => {
    const input = asObject(testCase.input);

    switch (problemSlug) {
      case "two-sum":
        return `        results.add(toJson(solution.${methodName}(${toJavaIntArrayLiteral(
          asNumberArray(input.nums),
        )}, ${asNumber(input.target)})));`;
      case "valid-parentheses":
        return `        results.add(toJson(solution.${methodName}(${JSON.stringify(
          asString(input.s),
        )})));`;
      case "best-time-to-buy-and-sell-stock":
        return `        results.add(toJson(solution.${methodName}(${toJavaIntArrayLiteral(
          asNumberArray(input.prices),
        )})));`;
      default:
        return `        // Unsupported test case ${index}`;
    }
  });

  return [
    "import java.util.ArrayList;",
    "import java.util.List;",
    userCode,
    "",
    "class CodeCoachMain {",
    "    private static String toJson(int[] values) {",
    '        if (values == null) return "null";',
    '        StringBuilder builder = new StringBuilder("[");',
    "        for (int index = 0; index < values.length; index++) {",
    '            if (index > 0) builder.append(",");',
    "            builder.append(values[index]);",
    "        }",
    '        builder.append("]");',
    "        return builder.toString();",
    "    }",
    "",
    "    private static String toJson(boolean value) {",
    '        return value ? "true" : "false";',
    "    }",
    "",
    "    private static String toJson(int value) {",
    "        return Integer.toString(value);",
    "    }",
    "",
    "    public static void main(String[] args) {",
    "        Solution solution = new Solution();",
    "        List<String> results = new ArrayList<>();",
    ...invocationLines,
    `        System.out.println("${RESULT_START}");`,
    '        System.out.println("[" + String.join(",", results) + "]");',
    `        System.out.println("${RESULT_END}");`,
    "    }",
    "}",
    "",
  ].join("\n");
}

function buildCppProgram(
  problemSlug: ProblemSlug,
  userCode: string,
  testCases: StoredTestCase[],
) {
  const methodName =
    problemSlug === "two-sum"
      ? "twoSum"
      : problemSlug === "valid-parentheses"
        ? "isValid"
        : "maxProfit";

  const invocationBlocks = testCases.map((testCase, index) => {
    const input = asObject(testCase.input);

    switch (problemSlug) {
      case "two-sum":
        return [
          `    std::vector<int> case_${index} = ${toCppVectorLiteral(asNumberArray(
            input.nums,
          ))};`,
          `    results.push_back(toJson(solution.${methodName}(case_${index}, ${asNumber(
            input.target,
          )})));`,
        ].join("\n");
      case "valid-parentheses":
        return `    results.push_back(toJson(solution.${methodName}(${escapeJavaOrCppString(
          asString(input.s),
        )})));`;
      case "best-time-to-buy-and-sell-stock":
        return [
          `    std::vector<int> case_${index} = ${toCppVectorLiteral(asNumberArray(
            input.prices,
          ))};`,
          `    results.push_back(toJson(solution.${methodName}(case_${index})));`,
        ].join("\n");
    }
  });

  return [
    "#include <iostream>",
    "#include <string>",
    "#include <vector>",
    userCode,
    "",
    "static std::string toJson(const std::vector<int>& values) {",
    '    std::string json = "[";',
    "    for (size_t index = 0; index < values.size(); index++) {",
    '        if (index > 0) json += ",";',
    "        json += std::to_string(values[index]);",
    "    }",
    '    json += "]";',
    "    return json;",
    "}",
    "",
    "static std::string toJson(bool value) {",
    '    return value ? "true" : "false";',
    "}",
    "",
    "static std::string toJson(int value) {",
    "    return std::to_string(value);",
    "}",
    "",
    "int main() {",
    "    Solution solution;",
    "    std::vector<std::string> results;",
    ...invocationBlocks,
    `    std::cout << "${RESULT_START}" << std::endl;`,
    '    std::cout << "[";',
    "    for (size_t index = 0; index < results.size(); index++) {",
    '        if (index > 0) std::cout << ",";',
    "        std::cout << results[index];",
    "    }",
    '    std::cout << "]" << std::endl;',
    `    std::cout << "${RESULT_END}" << std::endl;`,
    "    return 0;",
    "}",
    "",
  ].join("\n");
}

const SUPPORTED_PROBLEMS: Record<ProblemSlug, SupportedProblemConfig> = {
  "two-sum": {
    buildProgram(language, userCode, testCases) {
      switch (language) {
        case "Python":
          return buildPythonProgram("two-sum", userCode, testCases);
        case "JavaScript":
          return buildJavaScriptProgram("two-sum", userCode, testCases);
        case "Java":
          return buildJavaProgram("two-sum", userCode, testCases);
        case "C++":
          return buildCppProgram("two-sum", userCode, testCases);
      }
    },
    compare: compareTwoSum,
    summarizeInput: summarizeTwoSumInput,
  },
  "valid-parentheses": {
    buildProgram(language, userCode, testCases) {
      switch (language) {
        case "Python":
          return buildPythonProgram("valid-parentheses", userCode, testCases);
        case "JavaScript":
          return buildJavaScriptProgram(
            "valid-parentheses",
            userCode,
            testCases,
          );
        case "Java":
          return buildJavaProgram("valid-parentheses", userCode, testCases);
        case "C++":
          return buildCppProgram("valid-parentheses", userCode, testCases);
      }
    },
    compare: compareBoolean,
    summarizeInput: summarizeValidParenthesesInput,
  },
  "best-time-to-buy-and-sell-stock": {
    buildProgram(language, userCode, testCases) {
      switch (language) {
        case "Python":
          return buildPythonProgram(
            "best-time-to-buy-and-sell-stock",
            userCode,
            testCases,
          );
        case "JavaScript":
          return buildJavaScriptProgram(
            "best-time-to-buy-and-sell-stock",
            userCode,
            testCases,
          );
        case "Java":
          return buildJavaProgram(
            "best-time-to-buy-and-sell-stock",
            userCode,
            testCases,
          );
        case "C++":
          return buildCppProgram(
            "best-time-to-buy-and-sell-stock",
            userCode,
            testCases,
          );
      }
    },
    compare: compareNumber,
    summarizeInput: summarizeStockInput,
  },
};

export function isExecutionLanguage(
  value: string,
): value is ExecutionLanguage {
  return value in PISTON_LANGUAGE_CONFIG;
}

export function isProblemSlug(value: string): value is ProblemSlug {
  return value in SUPPORTED_PROBLEMS;
}

export function buildExecutionProgram(
  problemSlug: ProblemSlug,
  language: ExecutionLanguage,
  userCode: string,
  testCases: StoredTestCase[],
) {
  return SUPPORTED_PROBLEMS[problemSlug].buildProgram(
    language,
    userCode,
    testCases,
  );
}

export function extractExecutionResults(stdout: string) {
  const startIndex = stdout.indexOf(RESULT_START);
  const endIndex = stdout.indexOf(RESULT_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("The runner could not parse the execution results.");
  }

  const payload = stdout
    .slice(startIndex + RESULT_START.length, endIndex)
    .trim();

  if (!payload) {
    throw new Error("The runner returned an empty execution payload.");
  }

  return JSON.parse(payload) as unknown[];
}

export function summarizeTestInput(problemSlug: ProblemSlug, input: unknown) {
  return SUPPORTED_PROBLEMS[problemSlug].summarizeInput(input);
}

function createEmptyRunResult(): LocalCommandResult {
  return {
    stdout: "",
    stderr: "",
    output: "",
    code: 0,
    signal: null,
  };
}

function isCommandMissingError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

async function runLocalCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<LocalCommandResult> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (!error) {
          resolve({
            stdout,
            stderr,
            output: `${stdout}${stderr}`,
            code: 0,
            signal: null,
          });
          return;
        }

        if (isCommandMissingError(error)) {
          resolve({
            stdout: "",
            stderr: `${command} is not installed or not available on this machine.`,
            output: `${command} is not installed or not available on this machine.`,
            code: 127,
            signal: null,
          });
          return;
        }

        const commandError = error as Error & {
          code?: number | string | null;
          signal?: string | null;
        };

        resolve({
          stdout,
          stderr: stderr || commandError.message,
          output: `${stdout}${stderr || commandError.message}`,
          code:
            typeof commandError.code === "number" ? commandError.code : null,
          signal: commandError.signal ?? null,
        });
      },
    );
  });
}

async function executeLocally(
  language: ExecutionLanguage,
  source: string,
): Promise<PistonExecutionResult> {
  const config = PISTON_LANGUAGE_CONFIG[language];
  const tempDirectory = await mkdtemp(path.join(tmpdir(), "codecoach-run-"));
  const sourcePath = path.join(tempDirectory, config.fileName);

  try {
    await writeFile(sourcePath, source, "utf8");

    switch (language) {
      case "Python": {
        const run = await runLocalCommand(
          "python3",
          [config.fileName],
          tempDirectory,
          LOCAL_EXECUTION_TIMEOUT_MS,
        );

        return {
          language: config.language,
          version: "local",
          run,
        };
      }
      case "JavaScript": {
        const run = await runLocalCommand(
          "node",
          [config.fileName],
          tempDirectory,
          LOCAL_EXECUTION_TIMEOUT_MS,
        );

        return {
          language: config.language,
          version: "local",
          run,
        };
      }
      case "Java": {
        const compile = await runLocalCommand(
          "javac",
          [config.fileName],
          tempDirectory,
          LOCAL_EXECUTION_TIMEOUT_MS,
        );

        if (compile.code !== 0) {
          return {
            language: config.language,
            version: "local",
            compile,
            run: createEmptyRunResult(),
          };
        }

        const run = await runLocalCommand(
          "java",
          ["Main"],
          tempDirectory,
          LOCAL_EXECUTION_TIMEOUT_MS,
        );

        return {
          language: config.language,
          version: "local",
          compile,
          run,
        };
      }
      case "C++": {
        const compile = await runLocalCommand(
          "c++",
          ["-std=c++17", "-O2", config.fileName, "-o", "main"],
          tempDirectory,
          LOCAL_EXECUTION_TIMEOUT_MS,
        );

        if (compile.code !== 0) {
          return {
            language: config.language,
            version: "local",
            compile,
            run: createEmptyRunResult(),
          };
        }

        const run = await runLocalCommand(
          path.join(tempDirectory, "main"),
          [],
          tempDirectory,
          LOCAL_EXECUTION_TIMEOUT_MS,
        );

        return {
          language: config.language,
          version: "local",
          compile,
          run,
        };
      }
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

function shouldPreferLocalRunner() {
  if (CODE_RUNNER_PROVIDER === "local") {
    return true;
  }

  if (CODE_RUNNER_PROVIDER === "piston") {
    return false;
  }

  return process.platform === "darwin";
}

export function evaluateResults(
  problemSlug: ProblemSlug,
  testCases: StoredTestCase[],
  actualResults: unknown[],
): RunCaseResult[] {
  const config = SUPPORTED_PROBLEMS[problemSlug];

  return testCases.map((testCase, index) => {
    const actual = index < actualResults.length ? actualResults[index] : null;
    const passed =
      index < actualResults.length
        ? config.compare(actual, testCase.expected, testCase.input)
        : false;

    return {
      id: testCase.id,
      inputSummary: summarizeTestInput(problemSlug, testCase.input),
      expectedSummary: renderValue(testCase.expected),
      actualSummary:
        index < actualResults.length ? renderValue(actual) : "No result returned",
      passed,
      explanation: testCase.explanation,
    };
  });
}

export async function executeWithPiston(
  language: ExecutionLanguage,
  source: string,
) {
  const config = PISTON_LANGUAGE_CONFIG[language];

  try {
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [
          {
            name: config.fileName,
            content: source,
          },
        ],
        compile_timeout: PISTON_TIMEOUT_MS,
        run_timeout: PISTON_TIMEOUT_MS,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedMessage: string | null = null;

      try {
        const parsedError = JSON.parse(errorBody) as { message?: string };
        parsedMessage =
          typeof parsedError.message === "string" ? parsedError.message : null;
      } catch {
        parsedMessage = null;
      }

      throw new Error(
        parsedMessage ||
          errorBody ||
          `Piston returned an unexpected status code (${response.status}).`,
      );
    }

    return (await response.json()) as PistonExecutionResult;
  } catch (error) {
    if (
      error instanceof Error &&
      /(fetch failed|ECONNREFUSED|ENOTFOUND|network|Public Piston API is now whitelist only)/i.test(
        error.message,
      )
    ) {
      throw new Error(
        `Piston is not reachable at ${PISTON_API_URL}. Start a local instance with \`${PISTON_SETUP_COMMAND}\`, or point PISTON_API_URL at your own hosted Piston server.`,
      );
    }

    throw error;
  }
}

export async function executeCode(
  language: ExecutionLanguage,
  source: string,
) {
  if (shouldPreferLocalRunner()) {
    return executeLocally(language, source);
  }

  const execution = await executeWithPiston(language, source);

  if (
    process.platform === "darwin" &&
    /Cannot run proxy, clone failed/i.test(
      execution.run.stderr || execution.run.output || "",
    )
  ) {
    return executeLocally(language, source);
  }

  return execution;
}

export function buildRunResponse(
  execution: PistonExecutionResult,
  problemSlug: ProblemSlug,
  testCases: StoredTestCase[],
): RunResponsePayload {
  const compileOutput = execution.compile?.output?.trim() || "";
  const runStderr = execution.run.stderr?.trim() || "";
  const runStdout = execution.run.stdout ?? execution.run.output ?? "";

  if (execution.compile && execution.compile.code !== 0) {
    return {
      status: "compile-error",
      summary: "Your code did not compile.",
      cases: [],
      stderr: compileOutput || execution.compile.stderr || execution.compile.stdout,
    };
  }

  if (execution.run.code !== 0) {
    return {
      status: "runtime-error",
      summary: "Your code crashed while running the visible test cases.",
      cases: [],
      stderr: runStderr || execution.run.output,
    };
  }

  const actualResults = extractExecutionResults(runStdout);
  const cases = evaluateResults(problemSlug, testCases, actualResults);
  const allPassed = cases.every((result) => result.passed);

  return {
    status: allPassed ? "accepted" : "wrong-answer",
    summary: allPassed
      ? `Accepted on ${cases.length} visible test case${cases.length === 1 ? "" : "s"}.`
      : `Passed ${cases.filter((result) => result.passed).length} of ${cases.length} visible test cases.`,
    cases,
    stdout: runStdout,
  };
}
