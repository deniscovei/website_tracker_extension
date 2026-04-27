/**
 * Toggle a disabled visual state on a row.
 * @param {Element | null} row
 * @param {boolean} disabled
 */
export function setToggleRowDisabled(row, disabled) {
  row?.classList.toggle("is-disabled", Boolean(disabled));
}
