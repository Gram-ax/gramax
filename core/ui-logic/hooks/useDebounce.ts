import { useCallback, useEffect, useRef } from "react";

type DebounceCallbackFn<T extends unknown[]> = (...args: T) => void | Promise<void>;

function useDebounce<T extends unknown[]>(callback: DebounceCallbackFn<T>, delay: number, canCancel = true) {
	const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

	const cancel = useCallback(() => {
		if (timeoutIdRef.current !== null && canCancel) {
			clearTimeout(timeoutIdRef.current);
			timeoutIdRef.current = null;
		}
	}, []);

	const start = useCallback(
		(...args: T) => {
			cancel();
			timeoutIdRef.current = setTimeout(() => {
				void callback(...args);
			}, delay);
		},
		[callback, delay],
	);

	useEffect(() => {
		return () => cancel();
	}, []);

	return { start, cancel, timeoutIdRef };
}

export { useDebounce };
