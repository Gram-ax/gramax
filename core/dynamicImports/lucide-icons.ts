import { getExecutingEnvironment } from "@app/resolveModule/env";
import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

let cachedLucideIconsPromise: Promise<typeof import("lucide-react")> = null;
let awaitedIcons: typeof import("lucide-react") = null;

const getSnapshot = () => {
	void lucideIcons();
	return awaitedIcons;
};

export const lucideIcons = (): Promise<typeof import("lucide-react")> => {
	if (cachedLucideIconsPromise === null) {
		cachedLucideIconsPromise = import("lucide-react").then((icons) => {
			awaitedIcons = icons;
			for (const l of listeners) l();
			return icons;
		});
	}
	return cachedLucideIconsPromise;
};

const preloadLucideIconsSoon = (): void => {
	if (getExecutingEnvironment() === "static") return;

	typeof queueMicrotask === "function"
		? queueMicrotask(() => void lucideIcons())
		: setTimeout(() => void lucideIcons(), 0);
};

preloadLucideIconsSoon();

const subscribe = (cb: () => void) => {
	listeners.add(cb);
	return () => listeners.delete(cb);
};

export const useLucideModule = () => {
	const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	return state;
};

export default lucideIcons;
