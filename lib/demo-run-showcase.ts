export type DemoLanguageOption = "Python" | "JavaScript" | "Java" | "C++";
export type DemoProblemSlug =
  | "two-sum"
  | "valid-parentheses"
  | "best-time-to-buy-and-sell-stock";
export type DemoVariant = "accepted" | "wrong-answer";

type DemoSnippetMap = Record<
  DemoProblemSlug,
  Record<DemoLanguageOption, Record<DemoVariant, string>>
>;

const DEMO_SNIPPETS: DemoSnippetMap = {
  "two-sum": {
    Python: {
      accepted: `def two_sum(nums, target):
    seen = {}

    for index, value in enumerate(nums):
        match = target - value
        if match in seen:
            return [seen[match], index]
        seen[value] = index

    return []
`,
      "wrong-answer": `def two_sum(nums, target):
    for index, value in enumerate(nums):
        if value == target:
            return [index]

    return []
`,
    },
    JavaScript: {
      accepted: `function twoSum(nums, target) {
  const seen = new Map();

  for (let index = 0; index < nums.length; index += 1) {
    const value = nums[index];
    const match = target - value;

    if (seen.has(match)) {
      return [seen.get(match), index];
    }

    seen.set(value, index);
  }

  return [];
}
`,
      "wrong-answer": `function twoSum(nums, target) {
  for (let index = 0; index < nums.length; index += 1) {
    if (nums[index] === target) {
      return [index];
    }
  }

  return [];
}
`,
    },
    Java: {
      accepted: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();

        for (int index = 0; index < nums.length; index++) {
            int value = nums[index];
            int match = target - value;

            if (seen.containsKey(match)) {
                return new int[]{seen.get(match), index};
            }

            seen.put(value, index);
        }

        return new int[0];
    }
}
`,
      "wrong-answer": `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int index = 0; index < nums.length; index++) {
            if (nums[index] == target) {
                return new int[]{index};
            }
        }

        return new int[0];
    }
}
`,
    },
    "C++": {
      accepted: `#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;

        for (int index = 0; index < static_cast<int>(nums.size()); index++) {
            int value = nums[index];
            int match = target - value;

            if (seen.count(match)) {
                return {seen[match], index};
            }

            seen[value] = index;
        }

        return {};
    }
};
`,
      "wrong-answer": `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int index = 0; index < static_cast<int>(nums.size()); index++) {
            if (nums[index] == target) {
                return {index};
            }
        }

        return {};
    }
};
`,
    },
  },
  "valid-parentheses": {
    Python: {
      accepted: `def is_valid(s):
    pairs = {
        ")": "(",
        "]": "[",
        "}": "{",
    }
    stack = []

    for char in s:
        if char in pairs.values():
            stack.append(char)
            continue

        if not stack or stack.pop() != pairs[char]:
            return False

    return not stack
`,
      "wrong-answer": `def is_valid(s):
    return len(s) % 2 == 0
`,
    },
    JavaScript: {
      accepted: `function isValid(s) {
  const pairs = {
    ")": "(",
    "]": "[",
    "}": "{",
  };
  const stack = [];

  for (const char of s) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);
      continue;
    }

    if (stack.length === 0 || stack.pop() !== pairs[char]) {
      return false;
    }
  }

  return stack.length === 0;
}
`,
      "wrong-answer": `function isValid(s) {
  return s.length % 2 === 0;
}
`,
    },
    Java: {
      accepted: `import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;

class Solution {
    public boolean isValid(String s) {
        Map<Character, Character> pairs = Map.of(
            ')', '(',
            ']', '[',
            '}', '{'
        );
        Deque<Character> stack = new ArrayDeque<>();

        for (int index = 0; index < s.length(); index++) {
            char current = s.charAt(index);

            if (current == '(' || current == '[' || current == '{') {
                stack.push(current);
                continue;
            }

            if (stack.isEmpty() || stack.pop() != pairs.get(current)) {
                return false;
            }
        }

        return stack.isEmpty();
    }
}
`,
      "wrong-answer": `class Solution {
    public boolean isValid(String s) {
        return s.length() % 2 == 0;
    }
}
`,
    },
    "C++": {
      accepted: `#include <stack>
#include <unordered_map>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        unordered_map<char, char> pairs = {
            {')', '('},
            {']', '['},
            {'}', '{'}
        };
        stack<char> open;

        for (char current : s) {
            if (current == '(' || current == '[' || current == '{') {
                open.push(current);
                continue;
            }

            if (open.empty() || open.top() != pairs[current]) {
                return false;
            }

            open.pop();
        }

        return open.empty();
    }
};
`,
      "wrong-answer": `class Solution {
public:
    bool isValid(string s) {
        return s.size() % 2 == 0;
    }
};
`,
    },
  },
  "best-time-to-buy-and-sell-stock": {
    Python: {
      accepted: `def max_profit(prices):
    best_buy = float("inf")
    best_profit = 0

    for price in prices:
        best_buy = min(best_buy, price)
        best_profit = max(best_profit, price - best_buy)

    return best_profit
`,
      "wrong-answer": `def max_profit(prices):
    return 0
`,
    },
    JavaScript: {
      accepted: `function maxProfit(prices) {
  let bestBuy = Infinity;
  let bestProfit = 0;

  for (const price of prices) {
    bestBuy = Math.min(bestBuy, price);
    bestProfit = Math.max(bestProfit, price - bestBuy);
  }

  return bestProfit;
}
`,
      "wrong-answer": `function maxProfit(prices) {
  return 0;
}
`,
    },
    Java: {
      accepted: `class Solution {
    public int maxProfit(int[] prices) {
        int bestBuy = Integer.MAX_VALUE;
        int bestProfit = 0;

        for (int price : prices) {
            bestBuy = Math.min(bestBuy, price);
            bestProfit = Math.max(bestProfit, price - bestBuy);
        }

        return bestProfit;
    }
}
`,
      "wrong-answer": `class Solution {
    public int maxProfit(int[] prices) {
        return 0;
    }
}
`,
    },
    "C++": {
      accepted: `#include <algorithm>
#include <climits>
#include <vector>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int bestBuy = INT_MAX;
        int bestProfit = 0;

        for (int price : prices) {
            bestBuy = min(bestBuy, price);
            bestProfit = max(bestProfit, price - bestBuy);
        }

        return bestProfit;
    }
};
`,
      "wrong-answer": `#include <vector>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        return 0;
    }
};
`,
    },
  },
};

export function getDemoRunShowcaseCode(
  problemSlug: DemoProblemSlug,
  language: DemoLanguageOption,
  variant: DemoVariant,
) {
  return DEMO_SNIPPETS[problemSlug][language][variant];
}
