import {
  PROBLEM_EXECUTION_META,
  type ProblemSlug,
} from "@/lib/problem-metadata";

type FallbackExample = {
  input: string;
  output: string;
  explanation?: string;
};

type FallbackProblemContent = {
  slug: ProblemSlug;
  description: string;
  examples: FallbackExample[];
  constraints: string[];
};

export type FallbackProblemDetail = {
  id: number;
  title: string;
  slug: ProblemSlug;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: FallbackExample[];
  constraints: string[];
  starterCode: Record<"python" | "javascript" | "java" | "cpp", string>;
};

function getJavaReturnType(problemSlug: ProblemSlug) {
  const metadata = PROBLEM_EXECUTION_META[problemSlug];

  switch (metadata.returnKind) {
    case "boolean":
      return "boolean";
    case "number":
      return problemSlug === "median-of-two-sorted-arrays" ? "double" : "int";
    case "numberArray":
      return "int[]";
    case "string":
      return "String";
  }
}

function getCppReturnType(problemSlug: ProblemSlug) {
  const metadata = PROBLEM_EXECUTION_META[problemSlug];

  switch (metadata.returnKind) {
    case "boolean":
      return "bool";
    case "number":
      return problemSlug === "median-of-two-sorted-arrays" ? "double" : "int";
    case "numberArray":
      return "vector<int>";
    case "string":
      return "string";
  }
}

function getReturnPlaceholder(
  problemSlug: ProblemSlug,
  language: "python" | "javascript" | "java" | "cpp",
) {
  const metadata = PROBLEM_EXECUTION_META[problemSlug];

  switch (metadata.returnKind) {
    case "boolean":
      return language === "python" ? "False" : "false";
    case "number":
      return "0";
    case "numberArray":
      return language === "java"
        ? "new int[] {}"
        : language === "cpp"
          ? "{}"
          : "[]";
    case "string":
      return '""';
  }
}

function buildStarterCode(problemSlug: ProblemSlug) {
  const metadata = PROBLEM_EXECUTION_META[problemSlug];
  const pythonArgs = metadata.argSpecs.map((spec) => spec.key).join(", ");
  const javaArgs = metadata.argSpecs
    .map((spec) => {
      switch (spec.kind) {
        case "numberArray":
          return `int[] ${spec.key}`;
        case "number":
          return `int ${spec.key}`;
        case "string":
          return `String ${spec.key}`;
        case "stringArray":
          return `String[] ${spec.key}`;
      }
    })
    .join(", ");
  const cppArgs = metadata.argSpecs
    .map((spec) => {
      switch (spec.kind) {
        case "numberArray":
          return `vector<int>& ${spec.key}`;
        case "number":
          return `int ${spec.key}`;
        case "string":
          return `string ${spec.key}`;
        case "stringArray":
          return `vector<string>& ${spec.key}`;
      }
    })
    .join(", ");

  return {
    python: `def ${metadata.pythonName}(${pythonArgs}):\n    # Write your solution here\n    return ${getReturnPlaceholder(problemSlug, "python")}\n`,
    javascript: `function ${metadata.camelName}(${pythonArgs}) {\n  // Write your solution here\n  return ${getReturnPlaceholder(problemSlug, "javascript")};\n}\n`,
    java: `class Solution {\n    public ${getJavaReturnType(problemSlug)} ${metadata.camelName}(${javaArgs}) {\n        // Write your solution here\n        return ${getReturnPlaceholder(problemSlug, "java")};\n    }\n}\n`,
    cpp: `#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${getCppReturnType(problemSlug)} ${metadata.camelName}(${cppArgs}) {\n        // Write your solution here\n        return ${getReturnPlaceholder(problemSlug, "cpp")};\n    }\n};\n`,
  };
}

const FALLBACK_PROBLEM_CONTENT: FallbackProblemContent[] = [
  {
    slug: "two-sum",
    description:
      "Given an integer array and a target sum, return the indices of the two elements whose values add up to the target. Exactly one valid pair exists, and you cannot reuse the same index twice.",
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "The values at indices 0 and 1 add up to 9.",
      },
      { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]" },
      { input: "nums = [3, 3], target = 6", output: "[0, 1]" },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i], target <= 10^9",
      "Exactly one answer exists.",
    ],
  },
  {
    slug: "valid-parentheses",
    description:
      "Given a string containing only bracket characters, determine whether every opening bracket is closed by the correct type in the correct order.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      {
        input: 's = "(]"',
        output: "false",
        explanation:
          "The closing bracket does not match the latest opening bracket.",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s contains only ()[]{} characters.",
    ],
  },
  {
    slug: "best-time-to-buy-and-sell-stock",
    description:
      "Given a list of stock prices by day, compute the maximum profit from exactly one buy followed by one later sell. If no profitable trade exists, return 0.",
    examples: [
      {
        input: "prices = [7, 1, 5, 3, 6, 4]",
        output: "5",
        explanation: "Buy at 1 and sell at 6.",
      },
      { input: "prices = [7, 6, 4, 3, 1]", output: "0" },
      { input: "prices = [2, 4, 1]", output: "2" },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4",
    ],
  },
  {
    slug: "contains-duplicate",
    description:
      "Return true if any value appears at least twice in the array. Otherwise, return false.",
    examples: [
      { input: "nums = [1, 2, 3, 1]", output: "true" },
      { input: "nums = [1, 2, 3, 4]", output: "false" },
      {
        input: "nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]",
        output: "true",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
    ],
  },
  {
    slug: "valid-anagram",
    description:
      "Given two lowercase strings, determine whether one can be formed by rearranging the characters of the other.",
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
      { input: 's = "listen", t = "silent"', output: "true" },
    ],
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters.",
    ],
  },
  {
    slug: "longest-substring-without-repeating-characters",
    description:
      "Given a string, return the length of the longest contiguous substring that contains no repeated characters.",
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc".',
      },
      { input: 's = "bbbbb"', output: "1" },
      { input: 's = "pwwkew"', output: "3" },
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s may contain English letters, digits, symbols, and spaces.",
    ],
  },
  {
    slug: "container-with-most-water",
    description:
      "Each value in the array represents a vertical line height. Choose two lines that, together with the x-axis, can hold the maximum amount of water.",
    examples: [
      { input: "height = [1, 8, 6, 2, 5, 4, 8, 3, 7]", output: "49" },
      { input: "height = [1, 1]", output: "1" },
      { input: "height = [4, 3, 2, 1, 4]", output: "16" },
    ],
    constraints: [
      "2 <= height.length <= 10^5",
      "0 <= height[i] <= 10^4",
    ],
  },
  {
    slug: "product-of-array-except-self",
    description:
      "Return an array where each position contains the product of every other element except the one at that index.",
    examples: [
      { input: "nums = [1, 2, 3, 4]", output: "[24, 12, 8, 6]" },
      { input: "nums = [-1, 1, 0, -3, 3]", output: "[0, 0, 9, 0, 0]" },
      { input: "nums = [2, 3, 4, 5]", output: "[60, 40, 30, 24]" },
    ],
    constraints: [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "Products fit in a 32-bit integer.",
    ],
  },
  {
    slug: "top-k-frequent-elements",
    description:
      "Return the k distinct values that occur most often in the array. The result can be returned in any order.",
    examples: [
      { input: "nums = [1, 1, 1, 2, 2, 3], k = 2", output: "[1, 2]" },
      { input: "nums = [1], k = 1", output: "[1]" },
      {
        input: "nums = [4, 4, 4, 6, 6, 7, 7, 7, 7], k = 2",
        output: "[7, 4]",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "k is in the range [1, number of unique elements].",
    ],
  },
  {
    slug: "search-in-rotated-sorted-array",
    description:
      "A sorted array was rotated at an unknown pivot. Return the index of the target value, or -1 if the target is missing.",
    examples: [
      { input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0", output: "4" },
      { input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 3", output: "-1" },
      { input: "nums = [1], target = 0", output: "-1" },
    ],
    constraints: [
      "1 <= nums.length <= 5000",
      "-10^4 <= nums[i], target <= 10^4",
      "All nums values are unique.",
    ],
  },
  {
    slug: "median-of-two-sorted-arrays",
    description:
      "Given two individually sorted arrays, return the median value of the combined sorted sequence.",
    examples: [
      { input: "nums1 = [1, 3], nums2 = [2]", output: "2.0" },
      { input: "nums1 = [1, 2], nums2 = [3, 4]", output: "2.5" },
      { input: "nums1 = [0, 0], nums2 = [0, 0]", output: "0.0" },
    ],
    constraints: [
      "0 <= nums1.length, nums2.length <= 1000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6",
      "At least one array is non-empty.",
    ],
  },
  {
    slug: "trapping-rain-water",
    description:
      "Each array value is a wall height. Compute how many units of water would remain trapped after rainfall.",
    examples: [
      { input: "height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]", output: "6" },
      { input: "height = [4, 2, 0, 3, 2, 5]", output: "9" },
      { input: "height = [2, 0, 2]", output: "2" },
    ],
    constraints: [
      "1 <= height.length <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
  },
  {
    slug: "first-missing-positive",
    description:
      "Return the smallest positive integer that does not appear anywhere in the input array.",
    examples: [
      { input: "nums = [1, 2, 0]", output: "3" },
      { input: "nums = [3, 4, -1, 1]", output: "2" },
      { input: "nums = [7, 8, 9, 11, 12]", output: "1" },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-2^31 <= nums[i] <= 2^31 - 1",
    ],
  },
  {
    slug: "largest-rectangle-in-histogram",
    description:
      "Each bar in the histogram has width 1. Return the area of the largest rectangle that can be formed using adjacent bars.",
    examples: [
      { input: "heights = [2, 1, 5, 6, 2, 3]", output: "10" },
      { input: "heights = [2, 4]", output: "4" },
      { input: "heights = [2, 1, 2]", output: "3" },
    ],
    constraints: [
      "1 <= heights.length <= 10^5",
      "0 <= heights[i] <= 10^4",
    ],
  },
  {
    slug: "minimum-window-substring",
    description:
      "Find the shortest substring of s that contains every character of t with the required counts. If no such substring exists, return an empty string.",
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"' },
      { input: 's = "a", t = "a"', output: '"a"' },
      { input: 's = "a", t = "aa"', output: '""' },
    ],
    constraints: [
      "1 <= s.length, t.length <= 10^5",
      "s and t contain English letters.",
    ],
  },
];

export const FALLBACK_PROBLEMS: FallbackProblemDetail[] =
  FALLBACK_PROBLEM_CONTENT.map((problem, index) => {
    const metadata = PROBLEM_EXECUTION_META[problem.slug];

    return {
      id: index + 1,
      title: metadata.title,
      slug: problem.slug,
      difficulty: metadata.difficulty,
      description: problem.description,
      examples: problem.examples,
      constraints: problem.constraints,
      starterCode: buildStarterCode(problem.slug),
    };
  });

export const FALLBACK_PROBLEM_SUMMARIES = FALLBACK_PROBLEMS.map(
  ({ id, title, slug, difficulty }) => ({
    id,
    title,
    slug,
    difficulty,
  }),
);

export function getFallbackProblem(
  slug: string,
): FallbackProblemDetail | null {
  return FALLBACK_PROBLEMS.find((problem) => problem.slug === slug) ?? null;
}
