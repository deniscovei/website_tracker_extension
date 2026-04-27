export const ALL_DAY_INTERVAL = {
  start: "00:00",
  end: "00:00"
};

/**
 * Create the default draft used by the Add website flow.
 * @returns {{domain: string, blockMode: string, dailyAllowanceMinutes: number, allowExtraTime: boolean, requirePinForExtraTime: boolean, intervals: Array<{start: string, end: string}>}}
 */
export function createDefaultSite() {
  return {
    domain: "",
    blockMode: "always",
    dailyAllowanceMinutes: 0,
    allowExtraTime: false,
    requirePinForExtraTime: false,
    intervals: [{ ...ALL_DAY_INTERVAL }]
  };
}
