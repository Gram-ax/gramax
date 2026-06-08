import { type DependencyList, type RefObject, useEffect, useState } from "react";

const useIsOverflow = <T extends HTMLElement>(ref: RefObject<T>, deps: DependencyList = []) => {
	const [isOverflow, setIsOverflow] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const check = () => setIsOverflow(el.scrollWidth > el.clientWidth);
		check();
		const ro = new ResizeObserver(check);
		ro.observe(el);
		return () => ro.disconnect();

		// biome-ignore lint/correctness/useExhaustiveDependencies: ok
	}, deps);

	return isOverflow;
};

export default useIsOverflow;
