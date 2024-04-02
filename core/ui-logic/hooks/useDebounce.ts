import { useCallback, useRef, useEffect } from "react";

type CallbackFunction = () => void;

/* TODO надо понять зачем */
function useDebounce(callback: CallbackFunction, delay: number, canCancel = true) {
	const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

	const cancel = useCallback(() => {
		if (timeoutIdRef.current !== null && canCancel) {
			clearTimeout(timeoutIdRef.current);
			timeoutIdRef.current = null;
		}
	}, []);

	const start = useCallback(() => {
		cancel();
		timeoutIdRef.current = setTimeout(() => {
			callback();
		}, delay);
	}, [callback, delay]);

	useEffect(() => {
		return () => cancel();
	}, []);

	return { start, cancel, timeoutIdRef };
}

export { useDebounce };
