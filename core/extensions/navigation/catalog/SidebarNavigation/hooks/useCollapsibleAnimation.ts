import { type AnimationEvent, useCallback, useState } from "react";

export const useCollapsibleAnimation = (onOpenChange: (open: boolean) => void) => {
	const [animating, setAnimating] = useState(false);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			const reduceMotion =
				typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
			setAnimating(!reduceMotion);
			onOpenChange(open);
		},
		[onOpenChange],
	);

	const handleAnimationEnd = useCallback((event: AnimationEvent<HTMLElement>) => {
		if (event.target !== event.currentTarget) return;
		setAnimating(false);
	}, []);

	return { animating, handleOpenChange, handleAnimationEnd };
};
