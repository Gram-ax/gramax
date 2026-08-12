import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { AFTER_CONTAINER_HOVER_OFFSET_PX } from "../utils/constants";

export function useHoverBelowNavigation(containerRef: RefObject<HTMLDivElement | null>) {
	const [isHoverBelow, setIsHoverBelow] = useState(false);

	useEffect(() => {
		const leftNavigationContent = containerRef.current.closest(".left-navigation-content");
		const onPointerMove = (e: PointerEvent) => {
			const containerRect = containerRef.current?.getBoundingClientRect();
			const panelRect = leftNavigationContent?.getBoundingClientRect();
			if (!containerRect || !panelRect) return;
			setIsHoverBelow(
				e.clientY >= containerRect.bottom + AFTER_CONTAINER_HOVER_OFFSET_PX &&
					e.clientY <= panelRect.bottom &&
					e.clientX >= panelRect.left &&
					e.clientX <= panelRect.right,
			);
		};
		window.addEventListener("pointermove", onPointerMove);
		return () => window.removeEventListener("pointermove", onPointerMove);
	}, [containerRef]);

	return { isHoverBelow };
}
