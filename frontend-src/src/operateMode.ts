/** Operate / compact operational UI preference for the ConX Lovelace card. */

export const OPERATE_MODE_STORAGE_KEY = "conx-dynamic-panel-operate";

const memoryStore: { operate?: boolean } = {};

export function loadStoredOperateMode(): boolean {
  try {
    const value = globalThis.localStorage?.getItem?.(OPERATE_MODE_STORAGE_KEY);
    if (value === "1") {
      return true;
    }
    if (value === "0") {
      return false;
    }
  } catch {
    /* ignore */
  }
  return memoryStore.operate === true;
}

export function persistOperateMode(operate: boolean): void {
  memoryStore.operate = operate;
  try {
    globalThis.localStorage?.setItem?.(
      OPERATE_MODE_STORAGE_KEY,
      operate ? "1" : "0"
    );
  } catch {
    /* ignore */
  }
}

/** Test helper to clear the stored operate-mode preference. */
export function clearStoredOperateMode(): void {
  delete memoryStore.operate;
  try {
    globalThis.localStorage?.removeItem?.(OPERATE_MODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
