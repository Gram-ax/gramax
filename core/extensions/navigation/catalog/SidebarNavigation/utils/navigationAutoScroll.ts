const EDGE_ZONE_RATIO = 0.25;
const MAX_SCROLL_DELTA = 32;

interface NavigationViewport {
	top: number;
	bottom: number;
}

export const getNavigationAutoScrollDelta = (pointerY: number, viewport: NavigationViewport): number => {
	const edgeZone = (viewport.bottom - viewport.top) * EDGE_ZONE_RATIO;
	const topDistance = pointerY - viewport.top;
	if (topDistance < edgeZone) {
		return -MAX_SCROLL_DELTA * Math.min(1, (edgeZone - topDistance) / edgeZone);
	}

	const bottomDistance = viewport.bottom - pointerY;
	if (bottomDistance < edgeZone) {
		return MAX_SCROLL_DELTA * Math.min(1, (edgeZone - bottomDistance) / edgeZone);
	}

	return 0;
};
