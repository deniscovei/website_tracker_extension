/**
 * Query one element from a root.
 * @param {ParentNode} root
 * @param {string} selector
 * @returns {Element | null}
 */
export function qs(root, selector) {
  return root.querySelector(selector);
}

/**
 * Remove and replace children in one expression.
 * @param {Element} element
 * @param {...Node} children
 */
export function replaceChildren(element, ...children) {
  element.replaceChildren(...children);
}
