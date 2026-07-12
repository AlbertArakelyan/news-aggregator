import { RefObject, useEffect, useRef } from "react";

/**
 * Calls `onEnter` when the element scrolls into (or near) view.
 *
 * A callback rather than a boolean, deliberately. Returning `isOnScreen` would
 * force the caller to react to it in an effect — and calling setState
 * synchronously from an effect body is the cascading-render trap that
 * `react-hooks/set-state-in-effect` exists to catch. Firing from the observer's
 * own callback is an event, which is exactly where state updates belong.
 *
 * `rootMargin` fires *before* the sentinel is visible, so the next page is
 * already arriving by the time the reader reaches the bottom. The point of
 * infinite scroll is that it does not feel like paging.
 */
export default function useOnScreen(
  ref: RefObject<Element | null>,
  onEnter: () => void,
  isEnabled = true,
  rootMargin = "600px",
): void {
  // The observer is re-created only when it must be. Holding the callback in a
  // ref keeps a changing `onEnter` from tearing down and re-observing on every
  // render.
  const callbackRef = useRef(onEnter);

  useEffect(() => {
    callbackRef.current = onEnter;
  }, [onEnter]);

  useEffect(() => {
    const element = ref.current;

    if (!isEnabled || !element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callbackRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isEnabled, ref, rootMargin]);
}
