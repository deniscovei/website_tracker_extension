/**
 * Keep editor mode classes consistent for new vs existing websites.
 * @param {HTMLFormElement | null} form
 * @param {boolean} isNewSite
 */
export function syncEditorModeClasses(form, isNewSite) {
  form?.classList.toggle("is-new-site", isNewSite);
  form?.classList.toggle("is-existing-site", !isNewSite);
}
