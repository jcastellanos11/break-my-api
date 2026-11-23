/** Numerical Recipes LCG: a pure uint32 transition, including seed zero. */
export function nextRandom(seed: number): { state: number; value: number } {
  const state = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { state, value: state / 0x100000000 };
}
