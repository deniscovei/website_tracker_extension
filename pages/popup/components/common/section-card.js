/**
 * Tiny helper for modules that need a titled section element.
 * @param {string} className
 * @returns {HTMLElement}
 */
export function createSectionCard(className = "usage-panel") {
  const section = document.createElement("section");
  section.className = className;
  return section;
}
