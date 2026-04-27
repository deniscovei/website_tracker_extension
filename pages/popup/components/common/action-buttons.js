/**
 * Create a consistent popup action button.
 * @param {string} text
 * @param {string} className
 * @returns {HTMLButtonElement}
 */
export function createActionButton(text, className = "secondary-button") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  return button;
}
