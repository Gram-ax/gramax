import type { Collision, CollisionDetection, UniqueIdentifier } from "@dnd-kit/core";

type Rect = {
	top: number;
	bottom: number;
	left: number;
	right: number;
};

type IndexedRect = {
	id: UniqueIdentifier;
	rect: Rect;
	droppableContainer: Collision["data"]["droppableContainer"];
	order: number;
};

let cachedRects: Parameters<CollisionDetection>[0]["droppableRects"] | null = null;
let indexedRects: IndexedRect[] = [];
let prefixMaxBottom: number[] = [];

export const invalidateNavigationCollisionDetection = () => {
	cachedRects = null;
	indexedRects = [];
	prefixMaxBottom = [];
};

const rebuildIndex = ({ droppableContainers, droppableRects }: Parameters<CollisionDetection>[0]) => {
	indexedRects = [];
	let order = 0;
	for (const droppableContainer of droppableContainers) {
		const rect = droppableRects.get(droppableContainer.id);
		if (rect) indexedRects.push({ id: droppableContainer.id, rect, droppableContainer, order });
		order++;
	}

	indexedRects.sort((left, right) => left.rect.top - right.rect.top || left.order - right.order);
	prefixMaxBottom = [];
	let maxBottom = -Infinity;
	for (const [index, entry] of indexedRects.entries()) {
		maxBottom = Math.max(maxBottom, entry.rect.bottom);
		prefixMaxBottom[index] = maxBottom;
	}
	cachedRects = droppableRects;
};

const lastRectStartingBefore = (pointerY: number): number => {
	let low = 0;
	let high = indexedRects.length;
	while (low < high) {
		const middle = Math.floor((low + high) / 2);
		if (indexedRects[middle].rect.top <= pointerY) low = middle + 1;
		else high = middle;
	}
	return low - 1;
};

const effectiveDistance = (x: number, y: number, rect: Rect): number => {
	const corners = [
		[rect.left, rect.top],
		[rect.right, rect.top],
		[rect.left, rect.bottom],
		[rect.right, rect.bottom],
	];
	const distance = corners.reduce((sum, [cornerX, cornerY]) => sum + Math.hypot(x - cornerX, y - cornerY), 0);
	return Number((distance / 4).toFixed(4));
};

export const navigationCollisionDetection: CollisionDetection = (args) => {
	const { droppableRects, pointerCoordinates } = args;
	if (!pointerCoordinates) return [];
	if (cachedRects !== droppableRects) rebuildIndex(args);

	const collisions: Array<Collision & { order: number }> = [];
	for (let index = lastRectStartingBefore(pointerCoordinates.y); index >= 0; index--) {
		if (prefixMaxBottom[index] < pointerCoordinates.y) break;
		const entry = indexedRects[index];
		const { rect } = entry;
		if (
			rect.bottom < pointerCoordinates.y ||
			pointerCoordinates.x < rect.left ||
			pointerCoordinates.x > rect.right
		) {
			continue;
		}

		collisions.push({
			id: entry.id,
			data: {
				droppableContainer: entry.droppableContainer,
				value: effectiveDistance(pointerCoordinates.x, pointerCoordinates.y, rect),
			},
			order: entry.order,
		});
	}

	return collisions
		.sort((left, right) => left.data.value - right.data.value || left.order - right.order)
		.map(({ order: _, ...collision }) => collision);
};
