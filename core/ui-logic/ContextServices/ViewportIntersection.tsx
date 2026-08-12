import { createContext, type ReactElement, useContext, useEffect, useMemo } from "react";

type OnIntersect = () => void;

interface ViewportIntersectionServiceType {
	observe: (element: Element, rootMargin: string, onIntersect: OnIntersect) => () => void;
	disconnect: () => void;
}

interface ObserverEntry {
	observer: IntersectionObserver;
	callbacks: Map<Element, Set<OnIntersect>>;
}

const createViewportIntersectionService = (): ViewportIntersectionServiceType => {
	const observers = new Map<string, ObserverEntry>();

	const getObserverEntry = (rootMargin: string) => {
		const existingEntry = observers.get(rootMargin);
		if (existingEntry) return existingEntry;

		const callbacks = new Map<Element, Set<OnIntersect>>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					callbacks.get(entry.target)?.forEach((callback) => callback());
				}
			},
			{ rootMargin },
		);
		const entry = { observer, callbacks };
		observers.set(rootMargin, entry);
		return entry;
	};

	return {
		observe: (element, rootMargin, onIntersect) => {
			const entry = getObserverEntry(rootMargin);
			const callbacks = entry.callbacks.get(element) ?? new Set<OnIntersect>();
			callbacks.add(onIntersect);
			entry.callbacks.set(element, callbacks);
			entry.observer.observe(element);

			return () => {
				const callbacks = entry.callbacks.get(element);
				if (!callbacks) return;
				callbacks.delete(onIntersect);
				if (callbacks.size) return;

				entry.callbacks.delete(element);
				entry.observer.unobserve(element);
			};
		},
		disconnect: () => {
			observers.forEach(({ observer, callbacks }) => {
				observer.disconnect();
				callbacks.clear();
			});
			observers.clear();
		},
	};
};

const fallbackViewportIntersectionService = createViewportIntersectionService();

const ViewportIntersectionContext = createContext<ViewportIntersectionServiceType>(fallbackViewportIntersectionService);

const ViewportIntersectionService = {
	Provider({ children }: { children: ReactElement }): ReactElement {
		const value = useMemo(createViewportIntersectionService, []);

		useEffect(() => () => value.disconnect(), [value]);

		return <ViewportIntersectionContext.Provider value={value}>{children}</ViewportIntersectionContext.Provider>;
	},

	get value(): ViewportIntersectionServiceType {
		return useContext(ViewportIntersectionContext);
	},
};

export default ViewportIntersectionService;
