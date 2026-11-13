'use client';

// True on phone-sized screens (narrower than Tailwind's `sm`, 640px), which
// get their own simpler layouts. False on the server and before hydration.
import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 639px)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function usePhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
