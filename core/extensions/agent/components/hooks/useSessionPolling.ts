import { useCallback, useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 450;

export const useSessionPolling = (intervalMs: number = DEFAULT_INTERVAL_MS) => {
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stop = useCallback(() => {
		if (timerRef.current != null) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const start = useCallback(
		(tick: () => Promise<void> | void) => {
			stop();
			void tick();
			timerRef.current = setInterval(() => {
				void tick();
			}, intervalMs);
		},
		[intervalMs, stop],
	);

	useEffect(() => stop, [stop]);

	return { start, stop };
};
