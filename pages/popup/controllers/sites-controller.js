/**
 * Controller boundary for website persistence. Existing popup code still owns
 * the full flow; this helper centralizes the key new-site rule.
 * @param {number | null} editingIndex
 * @param {boolean} fromSubmit
 * @returns {boolean}
 */
export function canPersistSiteDraft(editingIndex, fromSubmit) {
  return editingIndex !== null || Boolean(fromSubmit);
}
