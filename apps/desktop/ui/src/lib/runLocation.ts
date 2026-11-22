/**
 * "Where do my bots run?": two first-class choices, this computer (no server needed) or the server
 * the owner added (always on). The daemon models the server as the adopted "home"; choosing this
 * computer is the app's `workLocalNow` override. The choice is remembered by this app (per browser
 * profile) so it is a real default, not a mode that silently resets on the next start.
 */
export type RunPlace = "this" | "server";

const KEY = "praxi.runLocation";

export function readRunPlace(): RunPlace | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "this" || v === "server" ? v : null;
  } catch {
    return null;
  }
}

export function writeRunPlace(place: RunPlace): void {
  try {
    window.localStorage.setItem(KEY, place);
  } catch {
    // private mode or blocked storage: the choice just lasts for this session
  }
}

/** Switching the view while runs are live asks first; with nothing running it just switches. */
export function switchNeedsConfirm(liveRuns: number): boolean {
  return liveRuns > 0;
}

/** The message of the Stop result, always about the real count and the real place. */
export function stopResult(count: number): { key: "runLocation.stopNone" | "runLocation.stopped"; tone: "info" | "success" } {
  return count === 0 ? { key: "runLocation.stopNone", tone: "info" } : { key: "runLocation.stopped", tone: "success" };
}
