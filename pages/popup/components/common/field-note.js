/**
 * Update field-note visibility and copy.
 * @param {HTMLElement | null} note
 * @param {string} text
 * @param {boolean} visible
 */
export function renderFieldNote(note, text, visible) {
  if (!note) {
    return;
  }

  note.textContent = text;
  note.hidden = !visible;
}
