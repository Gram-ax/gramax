import { useCallback, useRef, useEffect } from "react";

type CallbackFunction<T> = (args?: T) => void;

// типы писал серега))
function useDebounce<K>(callback: CallbackFunction<K>, delay: number, canCancel = true) {
	const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

	const cancel = useCallback(() => {
		if (timeoutIdRef.current !== null && canCancel) {
			clearTimeout(timeoutIdRef.current);
			timeoutIdRef.current = null;
		}
	}, []);

	const start = useCallback(
		(...args: K[]) => {
			cancel();
			timeoutIdRef.current = setTimeout(() => {
				callback(...args);
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
