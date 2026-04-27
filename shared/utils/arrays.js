/**
 * Return a new array with duplicate primitive values removed.
 * @template T
 * @param {T[]} values
 * @returns {T[]}
 */
export function unique(values) {
  return Array.from(new Set(Array.isArray(values) ? values : []));
}
