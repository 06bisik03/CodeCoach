export type ExecutionLanguage = "Python" | "JavaScript" | "Java" | "C++";

export type ProblemSlug =
  | "two-sum"
  | "valid-parentheses"
  | "best-time-to-buy-and-sell-stock"
  | "contains-duplicate"
  | "valid-anagram"
  | "longest-substring-without-repeating-characters"
  | "container-with-most-water"
  | "product-of-array-except-self"
  | "top-k-frequent-elements"
  | "search-in-rotated-sorted-array"
  | "median-of-two-sorted-arrays"
  | "trapping-rain-water"
  | "first-missing-positive"
  | "largest-rectangle-in-histogram"
  | "minimum-window-substring";

export type InputKind = "numberArray" | "number" | "string" | "stringArray";
export type ReturnKind = "boolean" | "number" | "numberArray" | "string";
export type CompareKind =
  | "boolean"
  | "number"
  | "number-tolerance"
  | "string"
  | "number-array"
  | "unordered-number-array";

export type ProblemExecutionMeta = {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  progressWeight: 1 | 2 | 3;
  pythonName: string;
  camelName: string;
  argSpecs: Array<{
    key: string;
    kind: InputKind;
  }>;
  returnKind: ReturnKind;
  compareKind: CompareKind;
};

export const PROBLEM_EXECUTION_META: Record<ProblemSlug, ProblemExecutionMeta> =
  {
    "two-sum": {
      title: "Two Sum",
      difficulty: "Easy",
      progressWeight: 1,
      pythonName: "two_sum",
      camelName: "twoSum",
      argSpecs: [
        { key: "nums", kind: "numberArray" },
        { key: "target", kind: "number" },
      ],
      returnKind: "numberArray",
      compareKind: "unordered-number-array",
    },
    "valid-parentheses": {
      title: "Valid Parentheses",
      difficulty: "Easy",
      progressWeight: 1,
      pythonName: "is_valid",
      camelName: "isValid",
      argSpecs: [{ key: "s", kind: "string" }],
      returnKind: "boolean",
      compareKind: "boolean",
    },
    "best-time-to-buy-and-sell-stock": {
      title: "Best Time to Buy and Sell Stock",
      difficulty: "Easy",
      progressWeight: 1,
      pythonName: "max_profit",
      camelName: "maxProfit",
      argSpecs: [{ key: "prices", kind: "numberArray" }],
      returnKind: "number",
      compareKind: "number",
    },
    "contains-duplicate": {
      title: "Contains Duplicate",
      difficulty: "Easy",
      progressWeight: 1,
      pythonName: "contains_duplicate",
      camelName: "containsDuplicate",
      argSpecs: [{ key: "nums", kind: "numberArray" }],
      returnKind: "boolean",
      compareKind: "boolean",
    },
    "valid-anagram": {
      title: "Valid Anagram",
      difficulty: "Easy",
      progressWeight: 1,
      pythonName: "is_anagram",
      camelName: "isAnagram",
      argSpecs: [
        { key: "s", kind: "string" },
        { key: "t", kind: "string" },
      ],
      returnKind: "boolean",
      compareKind: "boolean",
    },
    "longest-substring-without-repeating-characters": {
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      progressWeight: 2,
      pythonName: "length_of_longest_substring",
      camelName: "lengthOfLongestSubstring",
      argSpecs: [{ key: "s", kind: "string" }],
      returnKind: "number",
      compareKind: "number",
    },
    "container-with-most-water": {
      title: "Container With Most Water",
      difficulty: "Medium",
      progressWeight: 2,
      pythonName: "max_area",
      camelName: "maxArea",
      argSpecs: [{ key: "height", kind: "numberArray" }],
      returnKind: "number",
      compareKind: "number",
    },
    "product-of-array-except-self": {
      title: "Product of Array Except Self",
      difficulty: "Medium",
      progressWeight: 2,
      pythonName: "product_except_self",
      camelName: "productExceptSelf",
      argSpecs: [{ key: "nums", kind: "numberArray" }],
      returnKind: "numberArray",
      compareKind: "number-array",
    },
    "top-k-frequent-elements": {
      title: "Top K Frequent Elements",
      difficulty: "Medium",
      progressWeight: 2,
      pythonName: "top_k_frequent",
      camelName: "topKFrequent",
      argSpecs: [
        { key: "nums", kind: "numberArray" },
        { key: "k", kind: "number" },
      ],
      returnKind: "numberArray",
      compareKind: "unordered-number-array",
    },
    "search-in-rotated-sorted-array": {
      title: "Search in Rotated Sorted Array",
      difficulty: "Medium",
      progressWeight: 2,
      pythonName: "search",
      camelName: "search",
      argSpecs: [
        { key: "nums", kind: "numberArray" },
        { key: "target", kind: "number" },
      ],
      returnKind: "number",
      compareKind: "number",
    },
    "median-of-two-sorted-arrays": {
      title: "Median of Two Sorted Arrays",
      difficulty: "Hard",
      progressWeight: 3,
      pythonName: "find_median_sorted_arrays",
      camelName: "findMedianSortedArrays",
      argSpecs: [
        { key: "nums1", kind: "numberArray" },
        { key: "nums2", kind: "numberArray" },
      ],
      returnKind: "number",
      compareKind: "number-tolerance",
    },
    "trapping-rain-water": {
      title: "Trapping Rain Water",
      difficulty: "Hard",
      progressWeight: 3,
      pythonName: "trap",
      camelName: "trap",
      argSpecs: [{ key: "height", kind: "numberArray" }],
      returnKind: "number",
      compareKind: "number",
    },
    "first-missing-positive": {
      title: "First Missing Positive",
      difficulty: "Hard",
      progressWeight: 3,
      pythonName: "first_missing_positive",
      camelName: "firstMissingPositive",
      argSpecs: [{ key: "nums", kind: "numberArray" }],
      returnKind: "number",
      compareKind: "number",
    },
    "largest-rectangle-in-histogram": {
      title: "Largest Rectangle in Histogram",
      difficulty: "Hard",
      progressWeight: 3,
      pythonName: "largest_rectangle_area",
      camelName: "largestRectangleArea",
      argSpecs: [{ key: "heights", kind: "numberArray" }],
      returnKind: "number",
      compareKind: "number",
    },
    "minimum-window-substring": {
      title: "Minimum Window Substring",
      difficulty: "Hard",
      progressWeight: 3,
      pythonName: "min_window",
      camelName: "minWindow",
      argSpecs: [
        { key: "s", kind: "string" },
        { key: "t", kind: "string" },
      ],
      returnKind: "string",
      compareKind: "string",
    },
  };

export function isProblemSlug(value: string): value is ProblemSlug {
  return value in PROBLEM_EXECUTION_META;
}

export function getExpectedEntryPoint(
  problemSlug: ProblemSlug,
  language: ExecutionLanguage,
) {
  const metadata = PROBLEM_EXECUTION_META[problemSlug];
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

  switch (language) {
    case "Python":
      return `\`${metadata.pythonName}(${metadata.argSpecs
        .map((spec) => spec.key)
        .join(", ")})\` or \`Solution.${metadata.pythonName}(...)\``;
    case "JavaScript":
      return `\`${metadata.camelName}(${metadata.argSpecs
        .map((spec) => spec.key)
        .join(", ")})\` or \`Solution.${metadata.camelName}(...)\``;
    case "Java":
      return `\`Solution.${metadata.camelName}(${javaArgs})\``;
    case "C++":
      return `\`Solution::${metadata.camelName}(${cppArgs})\``;
  }
}
