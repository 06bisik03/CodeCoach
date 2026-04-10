import { describe, expect, it } from "vitest";
import {
  buildExecutionProgram,
  evaluateResults,
  extractExecutionResults,
  type StoredTestCase,
} from "@/lib/code-runner";

describe("code runner helpers", () => {
  it("extracts the JSON payload between output markers", () => {
    const output = [
      "debug log before marker",
      "__CODECOACH_RESULT_START__",
      '[[1,0],true]',
      "__CODECOACH_RESULT_END__",
      "debug log after marker",
    ].join("\n");

    expect(extractExecutionResults(output)).toEqual([[1, 0], true]);
  });

  it("treats two-sum answers as correct regardless of index order", () => {
    const testCases: StoredTestCase[] = [
      {
        id: 1,
        input: {
          nums: [2, 7, 11, 15],
          target: 9,
        },
        expected: [0, 1],
        explanation: "Basic happy path.",
      },
    ];

    const results = evaluateResults("two-sum", testCases, [[1, 0]]);

    expect(results[0]?.passed).toBe(true);
    expect(results[0]?.actualSummary).toBe("[1,0]");
  });

  it("treats top-k-frequent answers as correct regardless of order", () => {
    const testCases: StoredTestCase[] = [
      {
        id: 1,
        input: {
          nums: [1, 1, 1, 2, 2, 3],
          k: 2,
        },
        expected: [1, 2],
        explanation: "Order does not matter.",
      },
    ];

    const results = evaluateResults(
      "top-k-frequent-elements",
      testCases,
      [[2, 1]],
    );

    expect(results[0]?.passed).toBe(true);
  });

  it("allows small floating-point differences for median answers", () => {
    const testCases: StoredTestCase[] = [
      {
        id: 1,
        input: {
          nums1: [1, 2],
          nums2: [3, 4],
        },
        expected: 2.5,
        explanation: "Even-length merged array.",
      },
    ];

    const results = evaluateResults(
      "median-of-two-sorted-arrays",
      testCases,
      [2.5000000001],
    );

    expect(results[0]?.passed).toBe(true);
  });

  it("builds a wrapper program for JavaScript execution", () => {
    const source = buildExecutionProgram(
      "valid-parentheses",
      "JavaScript",
      "function isValid(s) { return s.length % 2 === 0; }",
      [
        {
          id: 1,
          input: { s: "()" },
          expected: true,
          explanation: null,
        },
      ],
    );

    expect(source).toContain("function _codecoachCall");
    expect(source).toContain('__CODECOACH_RESULT_START__');
    expect(source).toContain('results.push(_codecoachCall("()"));');
  });
});
