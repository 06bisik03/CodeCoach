import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type SeedTestCase = {
  input: Record<string, unknown>;
  expected: unknown;
  explanation?: string;
  isHidden?: boolean;
  sortOrder: number;
};

type SeedProblem = {
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  starterCode: {
    python: string;
    javascript: string;
    java: string;
    cpp: string;
  };
  testCases: SeedTestCase[];
};

const problems: SeedProblem[] = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "The numbers at indices 1 and 2 add up to 6.",
      },
      {
        input: "nums = [3, 3], target = 6",
        output: "[0, 1]",
        explanation:
          "The same index cannot be used twice, so the pair is the two distinct 3 values.",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Exactly one valid answer exists.",
    ],
    starterCode: {
      python:
        "def two_sum(nums, target):\n    # Write your solution here\n    pass\n",
      javascript:
        "function twoSum(nums, target) {\n  // Write your solution here\n}\n",
      java:
        "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[] {};\n    }\n}\n",
      cpp:
        "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n",
    },
    testCases: [
      {
        sortOrder: 1,
        input: { nums: [2, 7, 11, 15], target: 9 },
        expected: [0, 1],
        explanation: "Basic happy path.",
      },
      {
        sortOrder: 2,
        input: { nums: [3, 2, 4], target: 6 },
        expected: [1, 2],
        explanation: "Pair appears after the first element.",
      },
      {
        sortOrder: 3,
        input: { nums: [3, 3], target: 6 },
        expected: [0, 1],
        explanation: "Duplicate values should still use two indices.",
      },
      {
        sortOrder: 4,
        input: { nums: [-3, 4, 3, 90], target: 0 },
        expected: [0, 2],
        isHidden: true,
      },
      {
        sortOrder: 5,
        input: { nums: [0, 4, 3, 0], target: 0 },
        expected: [0, 3],
        isHidden: true,
      },
      {
        sortOrder: 6,
        input: { nums: [1, 5, 3, 7], target: 8 },
        expected: [0, 3],
        isHidden: true,
      },
      {
        sortOrder: 7,
        input: { nums: [2, 5, 5, 11], target: 10 },
        expected: [1, 2],
        isHidden: true,
      },
      {
        sortOrder: 8,
        input: {
          nums: [12, 18, 4, 9, 33, 7, 21, 30, 45, 1, 14, 27, 39, 6],
          target: 51,
        },
        expected: [0, 13],
        isHidden: true,
      },
    ],
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets are closed by the same type of brackets.\n2. Open brackets are closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    examples: [
      {
        input: 's = "()"',
        output: "true",
        explanation: "The opening parenthesis is closed correctly.",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
        explanation: "Each pair is matched and closed in the correct order.",
      },
      {
        input: 's = "(]"',
        output: "false",
        explanation:
          "The closing bracket does not match the most recent opening bracket.",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only: '()[]{}'.",
    ],
    starterCode: {
      python:
        "def is_valid(s):\n    # Write your solution here\n    pass\n",
      javascript:
        "function isValid(s) {\n  // Write your solution here\n}\n",
      java:
        "class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}\n",
      cpp:
        "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        return false;\n    }\n};\n",
    },
    testCases: [
      {
        sortOrder: 1,
        input: { s: "()" },
        expected: true,
        explanation: "Single balanced pair.",
      },
      {
        sortOrder: 2,
        input: { s: "()[]{}" },
        expected: true,
        explanation: "Multiple balanced bracket types.",
      },
      {
        sortOrder: 3,
        input: { s: "(]" },
        expected: false,
        explanation: "Mismatched closing bracket.",
      },
      {
        sortOrder: 4,
        input: { s: "([{}])" },
        expected: true,
        isHidden: true,
      },
      {
        sortOrder: 5,
        input: { s: "([)]" },
        expected: false,
        isHidden: true,
      },
      {
        sortOrder: 6,
        input: { s: ")" },
        expected: false,
        isHidden: true,
      },
      {
        sortOrder: 7,
        input: { s: "(((" },
        expected: false,
        isHidden: true,
      },
      {
        sortOrder: 8,
        input: { s: "{[()()]}[{}]" },
        expected: true,
        isHidden: true,
      },
      {
        sortOrder: 9,
        input: { s: "({[]})]" },
        expected: false,
        isHidden: true,
      },
    ],
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "Easy",
    description:
      "You are given an array prices where prices[i] is the price of a given stock on the i-th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    examples: [
      {
        input: "prices = [7, 1, 5, 3, 6, 4]",
        output: "5",
        explanation:
          "Buy on day 2 at price 1 and sell on day 5 at price 6 for a profit of 5.",
      },
      {
        input: "prices = [7, 6, 4, 3, 1]",
        output: "0",
        explanation:
          "In this case, no profitable transaction is possible, so return 0.",
      },
      {
        input: "prices = [2, 4, 1]",
        output: "2",
        explanation: "Buy at 2 and sell at 4 before the price drops to 1.",
      },
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4",
    ],
    starterCode: {
      python:
        "def max_profit(prices):\n    # Write your solution here\n    pass\n",
      javascript:
        "function maxProfit(prices) {\n  // Write your solution here\n}\n",
      java:
        "class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your solution here\n        return 0;\n    }\n}\n",
      cpp:
        "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write your solution here\n        return 0;\n    }\n};\n",
    },
    testCases: [
      {
        sortOrder: 1,
        input: { prices: [7, 1, 5, 3, 6, 4] },
        expected: 5,
        explanation: "Classic example with an early valley.",
      },
      {
        sortOrder: 2,
        input: { prices: [7, 6, 4, 3, 1] },
        expected: 0,
        explanation: "No profitable trade exists.",
      },
      {
        sortOrder: 3,
        input: { prices: [2, 4, 1] },
        expected: 2,
        explanation: "Short list with one profit window.",
      },
      {
        sortOrder: 4,
        input: { prices: [1] },
        expected: 0,
        isHidden: true,
      },
      {
        sortOrder: 5,
        input: { prices: [1, 2] },
        expected: 1,
        isHidden: true,
      },
      {
        sortOrder: 6,
        input: { prices: [2, 1] },
        expected: 0,
        isHidden: true,
      },
      {
        sortOrder: 7,
        input: { prices: [3, 2, 6, 5, 0, 3] },
        expected: 4,
        isHidden: true,
      },
      {
        sortOrder: 8,
        input: { prices: [9, 8, 7, 6, 5, 4, 3] },
        expected: 0,
        isHidden: true,
      },
      {
        sortOrder: 9,
        input: { prices: [8, 6, 5, 4, 7, 9, 3, 10] },
        expected: 7,
        isHidden: true,
      },
    ],
  },
];

async function main() {
  await prisma.testCase.deleteMany();
  await prisma.problem.deleteMany();

  for (const problem of problems) {
    const { testCases, ...problemData } = problem;

    await prisma.problem.create({
      data: {
        ...problemData,
        testCases: {
          create: testCases,
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
