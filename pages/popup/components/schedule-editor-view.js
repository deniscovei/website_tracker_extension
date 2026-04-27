/**
 * Decide whether schedule slots should be shown for a block mode.
 * @param {string} blockMode
 * @returns {boolean}
 */
export function shouldShowSlots(blockMode) {
  return blockMode !== "always";
}
