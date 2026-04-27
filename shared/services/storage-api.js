/**
 * Read values from chrome.storage.local.
 * @param {string | string[] | object | null} keys
 * @returns {Promise<object>}
 */
export function getLocalStorage(keys) {
  return chrome.storage.local.get(keys);
}

/**
 * Write values to chrome.storage.local.
 * @param {object} values
 * @returns {Promise<void>}
 */
export function setLocalStorage(values) {
  return chrome.storage.local.set(values);
}
