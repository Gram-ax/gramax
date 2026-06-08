import { useCallback, useLayoutEffect, useState } from "react";

interface UseUnmountAfterTransitionOptions {
	propertyName?: string;
}

function useUnmountAfterTransition(isVisible: boolean, options: UseUnmountAfterTransitionOptions = {}) {
	const { propertyName = "height" } = options;
	const [shouldMount, setShouldMount] = useState(isVisible);
	const [isExpanded, setIsExpanded] = useState(false);

	useLayoutEffect(() => {
		if (isVisible) {
			setShouldMount(true);
			setIsExpanded(false);
			const id = requestAnimationFrame(() => setIsExpanded(true));
			return () => cancelAnimationFrame(id);
		}
		setIsExpanded(false);
	}, [isVisible]);

	const onTransitionEnd = useCallback(
		(e: React.TransitionEvent) => {
			if (e.target !== e.currentTarget) return;
			if (e.propertyName === propertyName && !isVisible) setShouldMount(false);
		},
		[isVisible, propertyName],
	);

	return { shouldMount, isExpanded, onTransitionEnd };
}

export { useUnmountAfterTransition };
