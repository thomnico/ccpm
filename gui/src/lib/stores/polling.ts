import { getClient } from './client-helper';

export function startPolling(
  callback: () => Promise<void>,
  intervalMs: number
): () => void {
  let timer: ReturnType<typeof setInterval>;
  let currentInterval = intervalMs;
  let paused = false;
  let stopped = false;

  function reschedule(ms: number) {
    clearInterval(timer);
    currentInterval = ms;
    timer = setInterval(tick, currentInterval);
  }

  function tick() {
    if (paused || stopped) return;

    // Rate limit backoff
    const client = getClient();
    if (client) {
      const remaining = client.rateLimit.remaining;
      if (remaining < 50) {
        paused = true;
        return;
      }
      if (remaining < 100 && currentInterval < intervalMs * 2) {
        reschedule(intervalMs * 2);
      } else if (remaining >= 100 && currentInterval !== intervalMs) {
        reschedule(intervalMs);
      }
    }

    callback();
  }

  timer = setInterval(tick, currentInterval);

  function onVisibilityChange() {
    if (document.hidden) {
      paused = true;
    } else {
      paused = false;
      callback();
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    stopped = true;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

export function createBoardPoller(refreshFn: () => Promise<void>) {
  return startPolling(refreshFn, 30000);
}

export function createCommentPoller(refreshFn: () => Promise<void>) {
  return startPolling(refreshFn, 15000);
}
