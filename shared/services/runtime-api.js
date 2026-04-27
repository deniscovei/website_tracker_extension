/**
 * Send a message to the extension runtime.
 * @param {object} message
 * @returns {Promise<any>}
 */
export function sendRuntimeMessage(message) {
  return chrome.runtime.sendMessage(message);
}
