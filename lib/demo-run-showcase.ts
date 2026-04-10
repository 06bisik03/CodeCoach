import {
  type ExecutionLanguage,
  getExpectedEntryPoint,
  PROBLEM_EXECUTION_META,
  type ProblemSlug,
} from "@/lib/problem-metadata";

export type DemoLanguageOption = ExecutionLanguage;
export type DemoProblemSlug = ProblemSlug;
export type DemoVariant = "accepted" | "wrong-answer";

const ACCEPTED_SNIPPETS: Record<
  DemoProblemSlug,
  Record<DemoLanguageOption, string>
> = {
  "two-sum": {
    Python: `def two_sum(nums, target):
    seen = {}

    for index, value in enumerate(nums):
        match = target - value
        if match in seen:
            return [seen[match], index]
        seen[value] = index

    return []
`,
    JavaScript: `function twoSum(nums, target) {
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
    Java: `import java.util.HashMap;
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
    "C++": `#include <unordered_map>
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
  },
  "valid-parentheses": {
    Python: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []

    for char in s:
        if char in "([{":
            stack.append(char)
            continue

        if not stack or stack.pop() != pairs[char]:
            return False

    return not stack
`,
    JavaScript: `function isValid(s) {
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
    Java: `import java.util.ArrayDeque;
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
    "C++": `#include <stack>
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
  },
  "best-time-to-buy-and-sell-stock": {
    Python: `def max_profit(prices):
    best_buy = float("inf")
    best_profit = 0

    for price in prices:
        best_buy = min(best_buy, price)
        best_profit = max(best_profit, price - best_buy)

    return best_profit
`,
    JavaScript: `function maxProfit(prices) {
  let bestBuy = Number.POSITIVE_INFINITY;
  let bestProfit = 0;

  for (const price of prices) {
    bestBuy = Math.min(bestBuy, price);
    bestProfit = Math.max(bestProfit, price - bestBuy);
  }

  return bestProfit;
}
`,
    Java: `class Solution {
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
    "C++": `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int bestBuy = prices[0];
        int bestProfit = 0;

        for (int price : prices) {
            bestBuy = min(bestBuy, price);
            bestProfit = max(bestProfit, price - bestBuy);
        }

        return bestProfit;
    }
};
`,
  },
  "contains-duplicate": {
    Python: `def contains_duplicate(nums):
    seen = set()

    for value in nums:
        if value in seen:
            return True
        seen.add(value)

    return False
`,
    JavaScript: `function containsDuplicate(nums) {
  const seen = new Set();

  for (const value of nums) {
    if (seen.has(value)) {
      return true;
    }

    seen.add(value);
  }

  return false;
}
`,
    Java: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();

        for (int value : nums) {
            if (!seen.add(value)) {
                return true;
            }
        }

        return false;
    }
}
`,
    "C++": `#include <unordered_set>
#include <vector>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;

        for (int value : nums) {
            if (seen.count(value)) {
                return true;
            }

            seen.insert(value);
        }

        return false;
    }
};
`,
  },
  "valid-anagram": {
    Python: `from collections import Counter

def is_anagram(s, t):
    return Counter(s) == Counter(t)
`,
    JavaScript: `function isAnagram(s, t) {
  if (s.length !== t.length) {
    return false;
  }

  const counts = new Map();

  for (const char of s) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  for (const char of t) {
    if (!counts.has(char)) {
      return false;
    }

    const nextCount = counts.get(char) - 1;
    if (nextCount === 0) {
      counts.delete(char);
    } else {
      counts.set(char, nextCount);
    }
  }

  return counts.size === 0;
}
`,
    Java: `class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }

        int[] counts = new int[26];

        for (int index = 0; index < s.length(); index++) {
            counts[s.charAt(index) - 'a']++;
            counts[t.charAt(index) - 'a']--;
        }

        for (int count : counts) {
            if (count != 0) {
                return false;
            }
        }

        return true;
    }
}
`,
    "C++": `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.size() != t.size()) {
            return false;
        }

        vector<int> counts(26, 0);

        for (size_t index = 0; index < s.size(); index++) {
            counts[s[index] - 'a']++;
            counts[t[index] - 'a']--;
        }

        for (int count : counts) {
            if (count != 0) {
                return false;
            }
        }

        return true;
    }
};
`,
  },
  "longest-substring-without-repeating-characters": {
    Python: `def length_of_longest_substring(s):
    seen = {}
    left = 0
    best = 0

    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1

        seen[char] = right
        best = max(best, right - left + 1)

    return best
`,
    JavaScript: `function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right += 1) {
    const char = s[right];

    if (seen.has(char) && seen.get(char) >= left) {
      left = seen.get(char) + 1;
    }

    seen.set(char, right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}
`,
    Java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> seen = new HashMap<>();
        int left = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {
            char current = s.charAt(right);

            if (seen.containsKey(current) && seen.get(current) >= left) {
                left = seen.get(current) + 1;
            }

            seen.put(current, right);
            best = Math.max(best, right - left + 1);
        }

        return best;
    }
}
`,
    "C++": `#include <algorithm>
#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> seen;
        int left = 0;
        int best = 0;

        for (int right = 0; right < static_cast<int>(s.size()); right++) {
            char current = s[right];

            if (seen.count(current) && seen[current] >= left) {
                left = seen[current] + 1;
            }

            seen[current] = right;
            best = max(best, right - left + 1);
        }

        return best;
    }
};
`,
  },
  "container-with-most-water": {
    Python: `def max_area(height):
    left = 0
    right = len(height) - 1
    best = 0

    while left < right:
        best = max(best, min(height[left], height[right]) * (right - left))

        if height[left] <= height[right]:
            left += 1
        else:
            right -= 1

    return best
`,
    JavaScript: `function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let best = 0;

  while (left < right) {
    best = Math.max(
      best,
      Math.min(height[left], height[right]) * (right - left),
    );

    if (height[left] <= height[right]) {
      left += 1;
    } else {
      right -= 1;
    }
  }

  return best;
}
`,
    Java: `class Solution {
    public int maxArea(int[] height) {
        int left = 0;
        int right = height.length - 1;
        int best = 0;

        while (left < right) {
            best = Math.max(
                best,
                Math.min(height[left], height[right]) * (right - left)
            );

            if (height[left] <= height[right]) {
                left++;
            } else {
                right--;
            }
        }

        return best;
    }
}
`,
    "C++": `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        int left = 0;
        int right = static_cast<int>(height.size()) - 1;
        int best = 0;

        while (left < right) {
            best = max(best, min(height[left], height[right]) * (right - left));

            if (height[left] <= height[right]) {
                left++;
            } else {
                right--;
            }
        }

        return best;
    }
};
`,
  },
  "product-of-array-except-self": {
    Python: `def product_except_self(nums):
    result = [1] * len(nums)
    prefix = 1

    for index in range(len(nums)):
        result[index] = prefix
        prefix *= nums[index]

    suffix = 1
    for index in range(len(nums) - 1, -1, -1):
        result[index] *= suffix
        suffix *= nums[index]

    return result
`,
    JavaScript: `function productExceptSelf(nums) {
  const result = new Array(nums.length).fill(1);
  let prefix = 1;

  for (let index = 0; index < nums.length; index += 1) {
    result[index] = prefix;
    prefix *= nums[index];
  }

  let suffix = 1;
  for (let index = nums.length - 1; index >= 0; index -= 1) {
    result[index] *= suffix;
    suffix *= nums[index];
  }

  return result;
}
`,
    Java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        int[] result = new int[nums.length];
        int prefix = 1;

        for (int index = 0; index < nums.length; index++) {
            result[index] = prefix;
            prefix *= nums[index];
        }

        int suffix = 1;
        for (int index = nums.length - 1; index >= 0; index--) {
            result[index] *= suffix;
            suffix *= nums[index];
        }

        return result;
    }
}
`,
    "C++": `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        vector<int> result(nums.size(), 1);
        int prefix = 1;

        for (int index = 0; index < static_cast<int>(nums.size()); index++) {
            result[index] = prefix;
            prefix *= nums[index];
        }

        int suffix = 1;
        for (int index = static_cast<int>(nums.size()) - 1; index >= 0; index--) {
            result[index] *= suffix;
            suffix *= nums[index];
        }

        return result;
    }
};
`,
  },
  "top-k-frequent-elements": {
    Python: `from collections import Counter

def top_k_frequent(nums, k):
    counts = Counter(nums)
    ordered = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    return [value for value, _ in ordered[:k]]
`,
    JavaScript: `function topKFrequent(nums, k) {
  const counts = new Map();

  for (const value of nums) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, k)
    .map(([value]) => value);
}
`,
    Java: `import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();

        for (int value : nums) {
            counts.put(value, counts.getOrDefault(value, 0) + 1);
        }

        return counts.entrySet()
            .stream()
            .sorted((left, right) -> right.getValue() - left.getValue())
            .limit(k)
            .mapToInt(Map.Entry::getKey)
            .toArray();
    }
}
`,
    "C++": `#include <algorithm>
#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> counts;
        vector<pair<int, int>> ordered;

        for (int value : nums) {
            counts[value]++;
        }

        for (const auto& entry : counts) {
            ordered.push_back(entry);
        }

        sort(
            ordered.begin(),
            ordered.end(),
            [](const auto& left, const auto& right) {
                return left.second > right.second;
            }
        );

        vector<int> result;
        for (int index = 0; index < k; index++) {
            result.push_back(ordered[index].first);
        }

        return result;
    }
};
`,
  },
  "search-in-rotated-sorted-array": {
    Python: `def search(nums, target):
    left = 0
    right = len(nums) - 1

    while left <= right:
        middle = (left + right) // 2

        if nums[middle] == target:
            return middle

        if nums[left] <= nums[middle]:
            if nums[left] <= target < nums[middle]:
                right = middle - 1
            else:
                left = middle + 1
        else:
            if nums[middle] < target <= nums[right]:
                left = middle + 1
            else:
                right = middle - 1

    return -1
`,
    JavaScript: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);

    if (nums[middle] === target) {
      return middle;
    }

    if (nums[left] <= nums[middle]) {
      if (nums[left] <= target && target < nums[middle]) {
        right = middle - 1;
      } else {
        left = middle + 1;
      }
    } else if (nums[middle] < target && target <= nums[right]) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return -1;
}
`,
    Java: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;

        while (left <= right) {
            int middle = left + (right - left) / 2;

            if (nums[middle] == target) {
                return middle;
            }

            if (nums[left] <= nums[middle]) {
                if (nums[left] <= target && target < nums[middle]) {
                    right = middle - 1;
                } else {
                    left = middle + 1;
                }
            } else if (nums[middle] < target && target <= nums[right]) {
                left = middle + 1;
            } else {
                right = middle - 1;
            }
        }

        return -1;
    }
}
`,
    "C++": `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0;
        int right = static_cast<int>(nums.size()) - 1;

        while (left <= right) {
            int middle = left + (right - left) / 2;

            if (nums[middle] == target) {
                return middle;
            }

            if (nums[left] <= nums[middle]) {
                if (nums[left] <= target && target < nums[middle]) {
                    right = middle - 1;
                } else {
                    left = middle + 1;
                }
            } else if (nums[middle] < target && target <= nums[right]) {
                left = middle + 1;
            } else {
                right = middle - 1;
            }
        }

        return -1;
    }
};
`,
  },
  "median-of-two-sorted-arrays": {
    Python: `def find_median_sorted_arrays(nums1, nums2):
    merged = []
    left = 0
    right = 0

    while left < len(nums1) and right < len(nums2):
        if nums1[left] <= nums2[right]:
            merged.append(nums1[left])
            left += 1
        else:
            merged.append(nums2[right])
            right += 1

    merged.extend(nums1[left:])
    merged.extend(nums2[right:])

    middle = len(merged) // 2
    if len(merged) % 2 == 1:
        return float(merged[middle])

    return (merged[middle - 1] + merged[middle]) / 2
`,
    JavaScript: `function findMedianSortedArrays(nums1, nums2) {
  const merged = [];
  let left = 0;
  let right = 0;

  while (left < nums1.length && right < nums2.length) {
    if (nums1[left] <= nums2[right]) {
      merged.push(nums1[left]);
      left += 1;
    } else {
      merged.push(nums2[right]);
      right += 1;
    }
  }

  merged.push(...nums1.slice(left));
  merged.push(...nums2.slice(right));

  const middle = Math.floor(merged.length / 2);
  if (merged.length % 2 === 1) {
    return merged[middle];
  }

  return (merged[middle - 1] + merged[middle]) / 2;
}
`,
    Java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        int[] merged = new int[nums1.length + nums2.length];
        int left = 0;
        int right = 0;
        int write = 0;

        while (left < nums1.length && right < nums2.length) {
            if (nums1[left] <= nums2[right]) {
                merged[write++] = nums1[left++];
            } else {
                merged[write++] = nums2[right++];
            }
        }

        while (left < nums1.length) {
            merged[write++] = nums1[left++];
        }

        while (right < nums2.length) {
            merged[write++] = nums2[right++];
        }

        int middle = merged.length / 2;
        if (merged.length % 2 == 1) {
            return merged[middle];
        }

        return (merged[middle - 1] + merged[middle]) / 2.0;
    }
}
`,
    "C++": `#include <vector>
using namespace std;

class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        vector<int> merged;
        int left = 0;
        int right = 0;

        while (left < static_cast<int>(nums1.size()) && right < static_cast<int>(nums2.size())) {
            if (nums1[left] <= nums2[right]) {
                merged.push_back(nums1[left++]);
            } else {
                merged.push_back(nums2[right++]);
            }
        }

        while (left < static_cast<int>(nums1.size())) {
            merged.push_back(nums1[left++]);
        }

        while (right < static_cast<int>(nums2.size())) {
            merged.push_back(nums2[right++]);
        }

        int middle = static_cast<int>(merged.size()) / 2;
        if (merged.size() % 2 == 1) {
            return merged[middle];
        }

        return (merged[middle - 1] + merged[middle]) / 2.0;
    }
};
`,
  },
  "trapping-rain-water": {
    Python: `def trap(height):
    left = 0
    right = len(height) - 1
    left_max = 0
    right_max = 0
    trapped = 0

    while left < right:
        if height[left] <= height[right]:
            left_max = max(left_max, height[left])
            trapped += left_max - height[left]
            left += 1
        else:
            right_max = max(right_max, height[right])
            trapped += right_max - height[right]
            right -= 1

    return trapped
`,
    JavaScript: `function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let trapped = 0;

  while (left < right) {
    if (height[left] <= height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      trapped += leftMax - height[left];
      left += 1;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      trapped += rightMax - height[right];
      right -= 1;
    }
  }

  return trapped;
}
`,
    Java: `class Solution {
    public int trap(int[] height) {
        int left = 0;
        int right = height.length - 1;
        int leftMax = 0;
        int rightMax = 0;
        int trapped = 0;

        while (left < right) {
            if (height[left] <= height[right]) {
                leftMax = Math.max(leftMax, height[left]);
                trapped += leftMax - height[left];
                left++;
            } else {
                rightMax = Math.max(rightMax, height[right]);
                trapped += rightMax - height[right];
                right--;
            }
        }

        return trapped;
    }
}
`,
    "C++": `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        int left = 0;
        int right = static_cast<int>(height.size()) - 1;
        int leftMax = 0;
        int rightMax = 0;
        int trapped = 0;

        while (left < right) {
            if (height[left] <= height[right]) {
                leftMax = max(leftMax, height[left]);
                trapped += leftMax - height[left];
                left++;
            } else {
                rightMax = max(rightMax, height[right]);
                trapped += rightMax - height[right];
                right--;
            }
        }

        return trapped;
    }
};
`,
  },
  "first-missing-positive": {
    Python: `def first_missing_positive(nums):
    present = set(value for value in nums if value > 0)
    candidate = 1

    while candidate in present:
        candidate += 1

    return candidate
`,
    JavaScript: `function firstMissingPositive(nums) {
  const present = new Set(nums.filter((value) => value > 0));
  let candidate = 1;

  while (present.has(candidate)) {
    candidate += 1;
  }

  return candidate;
}
`,
    Java: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public int firstMissingPositive(int[] nums) {
        Set<Integer> present = new HashSet<>();

        for (int value : nums) {
            if (value > 0) {
                present.add(value);
            }
        }

        int candidate = 1;
        while (present.contains(candidate)) {
            candidate++;
        }

        return candidate;
    }
}
`,
    "C++": `#include <unordered_set>
#include <vector>
using namespace std;

class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {
        unordered_set<int> present;

        for (int value : nums) {
            if (value > 0) {
                present.insert(value);
            }
        }

        int candidate = 1;
        while (present.count(candidate)) {
            candidate++;
        }

        return candidate;
    }
};
`,
  },
  "largest-rectangle-in-histogram": {
    Python: `def largest_rectangle_area(heights):
    stack = []
    best = 0

    for index, height in enumerate(heights + [0]):
        start = index

        while stack and stack[-1][1] > height:
            start, previous_height = stack.pop()
            best = max(best, previous_height * (index - start))

        stack.append((start, height))

    return best
`,
    JavaScript: `function largestRectangleArea(heights) {
  const stack = [];
  let best = 0;

  for (let index = 0; index <= heights.length; index += 1) {
    const currentHeight = index === heights.length ? 0 : heights[index];
    let start = index;

    while (stack.length > 0 && stack[stack.length - 1][1] > currentHeight) {
      const [previousStart, previousHeight] = stack.pop();
      best = Math.max(best, previousHeight * (index - previousStart));
      start = previousStart;
    }

    stack.push([start, currentHeight]);
  }

  return best;
}
`,
    Java: `import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int largestRectangleArea(int[] heights) {
        Deque<int[]> stack = new ArrayDeque<>();
        int best = 0;

        for (int index = 0; index <= heights.length; index++) {
            int currentHeight = index == heights.length ? 0 : heights[index];
            int start = index;

            while (!stack.isEmpty() && stack.peek()[1] > currentHeight) {
                int[] previous = stack.pop();
                start = previous[0];
                best = Math.max(best, previous[1] * (index - previous[0]));
            }

            stack.push(new int[]{start, currentHeight});
        }

        return best;
    }
}
`,
    "C++": `#include <algorithm>
#include <stack>
#include <utility>
#include <vector>
using namespace std;

class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack<pair<int, int>> bars;
        int best = 0;

        for (int index = 0; index <= static_cast<int>(heights.size()); index++) {
            int currentHeight = index == static_cast<int>(heights.size()) ? 0 : heights[index];
            int start = index;

            while (!bars.empty() && bars.top().second > currentHeight) {
                auto previous = bars.top();
                bars.pop();
                start = previous.first;
                best = max(best, previous.second * (index - previous.first));
            }

            bars.push({start, currentHeight});
        }

        return best;
    }
};
`,
  },
  "minimum-window-substring": {
    Python: `from collections import Counter

def min_window(s, t):
    need = Counter(t)
    window = {}
    have = 0
    required = len(need)
    left = 0
    best = (float("inf"), 0, 0)

    for right, char in enumerate(s):
        window[char] = window.get(char, 0) + 1

        if char in need and window[char] == need[char]:
            have += 1

        while have == required:
            if right - left + 1 < best[0]:
                best = (right - left + 1, left, right)

            left_char = s[left]
            window[left_char] -= 1
            if left_char in need and window[left_char] < need[left_char]:
                have -= 1
            left += 1

    return "" if best[0] == float("inf") else s[best[1] : best[2] + 1]
`,
    JavaScript: `function minWindow(s, t) {
  const need = new Map();
  for (const char of t) {
    need.set(char, (need.get(char) ?? 0) + 1);
  }

  const window = new Map();
  let have = 0;
  const required = need.size;
  let left = 0;
  let best = [Number.POSITIVE_INFINITY, 0, 0];

  for (let right = 0; right < s.length; right += 1) {
    const char = s[right];
    window.set(char, (window.get(char) ?? 0) + 1);

    if (need.has(char) && window.get(char) === need.get(char)) {
      have += 1;
    }

    while (have === required) {
      if (right - left + 1 < best[0]) {
        best = [right - left + 1, left, right];
      }

      const leftChar = s[left];
      window.set(leftChar, window.get(leftChar) - 1);

      if (need.has(leftChar) && window.get(leftChar) < need.get(leftChar)) {
        have -= 1;
      }

      left += 1;
    }
  }

  return Number.isFinite(best[0]) ? s.slice(best[1], best[2] + 1) : "";
}
`,
    Java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public String minWindow(String s, String t) {
        Map<Character, Integer> need = new HashMap<>();
        for (int index = 0; index < t.length(); index++) {
            char current = t.charAt(index);
            need.put(current, need.getOrDefault(current, 0) + 1);
        }

        Map<Character, Integer> window = new HashMap<>();
        int have = 0;
        int required = need.size();
        int left = 0;
        int bestLength = Integer.MAX_VALUE;
        int bestStart = 0;

        for (int right = 0; right < s.length(); right++) {
            char current = s.charAt(right);
            window.put(current, window.getOrDefault(current, 0) + 1);

            if (need.containsKey(current) && window.get(current).intValue() == need.get(current).intValue()) {
                have++;
            }

            while (have == required) {
                if (right - left + 1 < bestLength) {
                    bestLength = right - left + 1;
                    bestStart = left;
                }

                char leftChar = s.charAt(left);
                window.put(leftChar, window.get(leftChar) - 1);

                if (need.containsKey(leftChar) && window.get(leftChar) < need.get(leftChar)) {
                    have--;
                }

                left++;
            }
        }

        return bestLength == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLength);
    }
}
`,
    "C++": `#include <climits>
#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    string minWindow(string s, string t) {
        unordered_map<char, int> need;
        unordered_map<char, int> window;

        for (char current : t) {
            need[current]++;
        }

        int have = 0;
        int required = static_cast<int>(need.size());
        int left = 0;
        int bestLength = INT_MAX;
        int bestStart = 0;

        for (int right = 0; right < static_cast<int>(s.size()); right++) {
            char current = s[right];
            window[current]++;

            if (need.count(current) && window[current] == need[current]) {
                have++;
            }

            while (have == required) {
                if (right - left + 1 < bestLength) {
                    bestLength = right - left + 1;
                    bestStart = left;
                }

                char leftChar = s[left];
                window[leftChar]--;

                if (need.count(leftChar) && window[leftChar] < need[leftChar]) {
                    have--;
                }

                left++;
            }
        }

        return bestLength == INT_MAX ? "" : s.substr(bestStart, bestLength);
    }
};
`,
  },
};

function getWrongAnswerPlaceholder(language: DemoLanguageOption, problemSlug: DemoProblemSlug) {
  const metadata = PROBLEM_EXECUTION_META[problemSlug];

  switch (metadata.returnKind) {
    case "boolean":
      return language === "Python"
        ? "False"
        : language === "JavaScript"
          ? "false"
          : language === "Java"
            ? "false"
            : "false";
    case "number":
      return "0";
    case "numberArray":
      return language === "Java"
        ? "new int[0]"
        : language === "C++"
          ? "{}"
          : "[]";
    case "string":
      return '""';
  }
}

function buildWrongAnswerSnippet(
  problemSlug: DemoProblemSlug,
  language: DemoLanguageOption,
) {
  const metadata = PROBLEM_EXECUTION_META[problemSlug];
  const placeholder = getWrongAnswerPlaceholder(language, problemSlug);
  const argumentList = metadata.argSpecs.map((spec) => spec.key).join(", ");

  switch (language) {
    case "Python":
      return `def ${metadata.pythonName}(${argumentList}):
    return ${placeholder}
`;
    case "JavaScript":
      return `function ${metadata.camelName}(${argumentList}) {
  return ${placeholder};
}
`;
    case "Java": {
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
      const returnType =
        metadata.returnKind === "boolean"
          ? "boolean"
          : metadata.returnKind === "number"
            ? problemSlug === "median-of-two-sorted-arrays"
                ? "double"
                : "int"
            : metadata.returnKind === "numberArray"
              ? "int[]"
              : "String";

      return `class Solution {
    public ${returnType} ${metadata.camelName}(${javaArgs}) {
        return ${placeholder};
    }
}
`;
    }
    case "C++": {
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
      const returnType =
        metadata.returnKind === "boolean"
          ? "bool"
          : metadata.returnKind === "number"
            ? problemSlug === "median-of-two-sorted-arrays"
              ? "double"
              : "int"
            : metadata.returnKind === "numberArray"
              ? "vector<int>"
              : "string";

      return `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    ${returnType} ${metadata.camelName}(${cppArgs}) {
        return ${placeholder};
    }
};
`;
    }
  }
}

export function hasDemoRunShowcaseProblem(
  value: string,
): value is DemoProblemSlug {
  return value in ACCEPTED_SNIPPETS;
}

export function getDemoRunShowcaseCode(
  problemSlug: DemoProblemSlug,
  language: DemoLanguageOption,
  variant: DemoVariant,
) {
  if (variant === "accepted") {
    return ACCEPTED_SNIPPETS[problemSlug][language];
  }

  return buildWrongAnswerSnippet(problemSlug, language);
}

export function getDemoRunShowcaseEntryPoint(
  problemSlug: DemoProblemSlug,
  language: DemoLanguageOption,
) {
  return getExpectedEntryPoint(problemSlug, language);
}
