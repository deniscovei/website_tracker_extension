/**
 * Merge partial global settings onto the existing settings shape.
 * @param {object} current
 * @param {object} next
 * @returns {object}
 */
export function mergeSettings(current, next) {
  return {
    ...current,
    ...next
  };
}
