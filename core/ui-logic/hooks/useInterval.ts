import { useCallback, useEffect, useRef } from "react";

export type UseIntervalCallback = () => unknown;

const useInterval = (callback: UseIntervalCallback, delay: number | null) => {
	const savedCallback = useRef<UseIntervalCallback>();
	const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	const start = useCallback(() => {
		if (delay == null || intervalId.current) return;

		const tick = () => savedCallback.current?.();
		tick();
		intervalId.current = setInterval(tick, delay);
	}, [delay]);

	const stop = useCallback(() => {
		if (intervalId.current) {
			clearInterval(intervalId.current);
			intervalId.current = null;
		}
	}, []);

	return {
		start,
		stop,
	};
};

export default useInterval;
