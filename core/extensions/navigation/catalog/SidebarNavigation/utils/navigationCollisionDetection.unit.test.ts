import { type CollisionDetection, pointerWithin } from "@dnd-kit/core";
import { invalidateNavigationCollisionDetection, navigationCollisionDetection } from "./navigationCollisionDetection";

const rect = (top: number, height: number, left = 0, width = 100) => ({
	bottom: top + height,
	height,
	left,
	right: left + width,
	top,
	width,
});

const args = (x: number, y: number) => {
	const containers = ["first", "second", "slot"].map((id) => ({ id }));
	return {
		droppableContainers: containers,
		droppableRects: new Map([
			["first", rect(0, 30)],
			["second", rect(30, 30)],
			["slot", rect(28, 8)],
		]),
		pointerCoordinates: { x, y },
	} as unknown as Parameters<CollisionDetection>[0];
};

describe("navigationCollisionDetection", () => {
	test.each([
		[50, 10],
		[50, 30],
		[50, 35],
		[50, 50],
		[150, 30],
	])("matches pointerWithin at (%i, %i)", (x, y) => {
		const input = args(x, y);

		expect(navigationCollisionDetection(input)).toEqual(pointerWithin(input));
	});

	test("returns no collisions without pointer coordinates", () => {
		const input = { ...args(50, 10), pointerCoordinates: null };

		expect(navigationCollisionDetection(input)).toEqual([]);
	});

	test("reuses the vertical index instead of scanning every rect on each pointer move", () => {
		let horizontalReads = 0;
		const containers = Array.from({ length: 1000 }, (_, index) => ({ id: String(index) }));
		const droppableRects = new Map(
			containers.map(({ id }, index) => {
				const top = index * 30;
				return [
					id,
					{
						bottom: top + 30,
						height: 30,
						get left() {
							horizontalReads++;
							return 0;
						},
						get right() {
							horizontalReads++;
							return 100;
						},
						top,
						width: 100,
					},
				] as const;
			}),
		);
		const input = {
			droppableContainers: containers,
			droppableRects,
			pointerCoordinates: { x: 50, y: 15_000 },
		} as unknown as Parameters<CollisionDetection>[0];
		navigationCollisionDetection(input);
		horizontalReads = 0;

		navigationCollisionDetection({ ...input, pointerCoordinates: { x: 50, y: 15_030 } });

		expect(horizontalReads).toBeLessThan(20);
	});

	test("rebuilds the vertical index after scrolling changes rect positions", () => {
		let scrollOffset = 0;
		const dynamicRect = {
			get bottom() {
				return 30 + scrollOffset;
			},
			height: 30,
			left: 0,
			right: 100,
			get top() {
				return scrollOffset;
			},
			width: 100,
		};
		const input = {
			droppableContainers: [{ id: "first" }],
			droppableRects: new Map([["first", dynamicRect]]),
			pointerCoordinates: { x: 50, y: 10 },
		} as unknown as Parameters<CollisionDetection>[0];

		expect(navigationCollisionDetection(input)).toHaveLength(1);
		scrollOffset = 100;
		invalidateNavigationCollisionDetection();

		expect(navigationCollisionDetection({ ...input, pointerCoordinates: { x: 50, y: 110 } })).toHaveLength(1);
	});
});
