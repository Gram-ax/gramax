import { useCallback, useMemo, useSyncExternalStore } from "react";

const useMediaQuery = (query: string): boolean => {
	const subscribe = useCallback(
		(notify: () => void) => {
			const supportMatchMedia = typeof window !== "undefined" && typeof window.matchMedia !== "undefined";
			if (!supportMatchMedia) return () => {};

			const mql = window.matchMedia(query);
			mql.addEventListener("change", notify);
			return () => mql.removeEventListener("change", notify);
		},
		[query],
	);

	const getSnapshot = useCallback(() => {
		const supportMatchMedia = typeof window !== "undefined" && typeof window.matchMedia !== "undefined";
		if (!supportMatchMedia) return false;
		return window.matchMedia(query).matches;
	}, [query]);

	const getServerSnapshot = useMemo(() => () => false, []);

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export default useMediaQuery;
