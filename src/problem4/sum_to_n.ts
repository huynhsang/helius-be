export function sum_to_n_a(n: number): number {
  // Recursive definition: sum(n) = n + sum(n - 1), base case sum(0) = 0.
  // Time: O(n), Space: O(n) due to call stack.
  if (n <= 0) {
    return 0;
  }

  return n + sum_to_n_a(n - 1);
}

export function sum_to_n_b(n: number): number {
  // Iterative accumulation from 1 to n.
  // Time: O(n), Space: O(1) - simple and easy to reason about.
  let sum = 0;

  for (let i = 1; i <= n; i += 1) {
    sum += i;
  }

  return sum;
}

export function sum_to_n_c(n: number): number {
  // Uses arithmetic progression formula: n * (n + 1) / 2
  // Time: O(1), Space: O(1) - most efficient for this problem.
  if (n <= 0) {
    return 0;
  }

  return (n * (n + 1)) / 2;
}
