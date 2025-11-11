import { throwIfAborted } from "./abort";

export const nextFrame = () =>
	new Promise<void>((resolve) => {
		if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
			window.requestAnimationFrame(() => resolve());
		} else {
			setTimeout(resolve, 0);
		}
	});

export const createChunkScheduler = (budgetMs = 24, signal?: AbortSignal) => {
	let lastYield = performance.now();

	return async (force = false) => {
		throwIfAborted(signal);
		const now = performance.now();

		if (force || now - lastYield >= budgetMs) {
			lastYield = now;
			await nextFrame();
			throwIfAborted(signal);
		}
	};
};

export const waitForNextPaint = (signal?: AbortSignal) =>
	new Promise<void>((resolve, reject) => {
		try {
			throwIfAborted(signal);
		} catch (error) {
			reject(error);
			return;
		}

		const complete = () => {
			try {
				throwIfAborted(signal);
				resolve();
			} catch (error) {
				reject(error);
			}
		};

		if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
			window.requestAnimationFrame(complete);
		} else {
			setTimeout(complete, 0);
		}
	});
