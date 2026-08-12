import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import { navigationTreeStore, useNavigationTreeStore } from "../store/navigationTreeStore";
import { parseBeforeItemSlotId } from "../utils/beforeItemSlot";
import { AUTO_EXPAND_DELAY_MS, DRAG_ACTIVATION_DISTANCE } from "../utils/constants";
import { DropMode, isGroupSlotMode } from "../utils/dropMode";
import { getDropMode } from "../utils/getDropMode";
import { groupIdFromSlotMode, lastSlotId, parseGroupSlotId } from "../utils/groupSlotId";
import { isDescendant } from "../utils/isDescendant";
import { getNavigationAutoScrollDelta } from "../utils/navigationAutoScroll";
import { invalidateNavigationCollisionDetection } from "../utils/navigationCollisionDetection";

const POINTER_SENSOR_OPTIONS = { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } };

export const useNavigationDnd = (containerRef: RefObject<HTMLDivElement | null>) => {
	const { setDragging, setDragTarget } = useNavigationTreeStore((s) => ({
		setDragging: s.setDragging,
		setDragTarget: s.setDragTarget,
	}));
	const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const autoExpandTargetRef = useRef<string | null>(null);
	const pointerYRef = useRef<number>(0);
	const hasPointerPositionRef = useRef(false);
	const autoScrollFrameRef = useRef<number | null>(null);

	useEffect(() => {
		const onPointerMove = (e: PointerEvent) => {
			pointerYRef.current = e.clientY;
			hasPointerPositionRef.current = true;
		};
		window.addEventListener("pointermove", onPointerMove);
		return () => window.removeEventListener("pointermove", onPointerMove);
	}, []);

	const sensors = useSensors(useSensor(PointerSensor, POINTER_SENSOR_OPTIONS));

	const stopAutoScroll = useCallback(() => {
		if (autoScrollFrameRef.current === null) return;
		cancelAnimationFrame(autoScrollFrameRef.current);
		autoScrollFrameRef.current = null;
	}, []);

	const startAutoScroll = useCallback(() => {
		if (autoScrollFrameRef.current !== null) return;

		const tick = () => {
			const scrollContainer = containerRef.current?.closest<HTMLElement>(".left-navigation-content");
			if (!scrollContainer) {
				autoScrollFrameRef.current = null;
				return;
			}

			const delta = getNavigationAutoScrollDelta(pointerYRef.current, scrollContainer.getBoundingClientRect());
			if (delta !== 0) {
				const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
				const nextScrollTop = Math.max(0, Math.min(maxScrollTop, scrollContainer.scrollTop + delta));
				if (nextScrollTop !== scrollContainer.scrollTop) {
					scrollContainer.scrollTop = nextScrollTop;
					invalidateNavigationCollisionDetection();
				}
			}

			autoScrollFrameRef.current = requestAnimationFrame(tick);
		};

		autoScrollFrameRef.current = requestAnimationFrame(tick);
	}, [containerRef]);

	useEffect(() => stopAutoScroll, [stopAutoScroll]);

	const cancelAutoExpand = useCallback(() => {
		if (autoExpandTimerRef.current !== null) {
			clearTimeout(autoExpandTimerRef.current);
			autoExpandTimerRef.current = null;
		}
		autoExpandTargetRef.current = null;
	}, []);

	const scheduleAutoExpand = useCallback(
		(overId: string) => {
			if (autoExpandTargetRef.current === overId) return;
			cancelAutoExpand();
			autoExpandTargetRef.current = overId;
			autoExpandTimerRef.current = setTimeout(() => {
				navigationTreeStore.getState().toggleExpanded(overId, true);
				autoExpandTimerRef.current = null;
			}, AUTO_EXPAND_DELAY_MS);
		},
		[cancelAutoExpand],
	);

	const onDragStart = useCallback(
		({ active }: DragStartEvent) => {
			setDragging(String(active.id));
		},
		[setDragging],
	);

	const onDragMove = useCallback(
		({ active, activatorEvent, delta, over }: DragMoveEvent) => {
			const { childrenMap, rootIds, parentMap, expanded } = navigationTreeStore.getState();
			const pointerY = hasPointerPositionRef.current
				? pointerYRef.current
				: activatorEvent && "clientY" in activatorEvent && typeof activatorEvent.clientY === "number"
					? activatorEvent.clientY + delta.y
					: pointerYRef.current;
			pointerYRef.current = pointerY;
			hasPointerPositionRef.current = true;
			startAutoScroll();
			const draggedId = String(active.id);

			if (!over) {
				const isBelowContainer = pointerY >= (containerRef.current?.getBoundingClientRect().bottom ?? Infinity);

				if (isBelowContainer) {
					const lastGroupId = rootIds[rootIds.length - 1];
					if (lastGroupId) {
						const invalid = draggedId === lastGroupId || isDescendant(childrenMap, draggedId, lastGroupId);
						setDragTarget(
							invalid
								? null
								: {
										anchorId: lastSlotId(lastGroupId),
										parentId: null,
										mode: DropMode.LastRoot,
									},
						);
						cancelAutoExpand();
						return;
					}
				}

				setDragTarget(null);
				cancelAutoExpand();
				return;
			}

			const overId = String(over.id);
			const beforeItemId = parseBeforeItemSlotId(overId);
			if (beforeItemId) {
				const invalid = draggedId === beforeItemId || isDescendant(childrenMap, draggedId, beforeItemId);
				cancelAutoExpand();
				setDragTarget(
					invalid
						? null
						: { anchorId: beforeItemId, parentId: parentMap[beforeItemId] ?? null, mode: DropMode.Before },
				);
				return;
			}

			const slot = parseGroupSlotId(overId);
			if (slot) {
				const { groupId, mode } = slot;
				const invalid = draggedId === groupId || isDescendant(childrenMap, draggedId, groupId);
				cancelAutoExpand();
				setDragTarget(invalid ? null : { anchorId: overId, parentId: groupId, mode });
				return;
			}

			if (overId === draggedId || isDescendant(childrenMap, draggedId, overId)) {
				setDragTarget(null);
				cancelAutoExpand();
				return;
			}

			const rect = over?.rect;
			if (!rect) return;

			const mode = getDropMode(pointerY, rect);
			const parentId = mode === DropMode.Into ? null : (parentMap[overId] ?? null);
			setDragTarget({ anchorId: overId, parentId, mode });

			const hasChildren = (childrenMap[overId]?.length ?? 0) > 0;
			const isCollapsed = !expanded.has(overId);
			if (mode === DropMode.Into && hasChildren && isCollapsed) {
				scheduleAutoExpand(overId);
			} else {
				cancelAutoExpand();
			}
		},
		[containerRef, setDragTarget, cancelAutoExpand, scheduleAutoExpand, startAutoScroll],
	);

	const onDragEnd = useCallback(
		({ active }: DragEndEvent) => {
			const { dragTarget, onDrop, childrenMap: currentChildren } = navigationTreeStore.getState();
			if (dragTarget && onDrop) {
				const draggedId = String(active.id);
				const { anchorId, mode } = dragTarget;

				if (mode === DropMode.LastRoot) {
					const slot = parseGroupSlotId(anchorId);
					if (slot) void onDrop(draggedId, slot.groupId, DropMode.After);
				} else if (isGroupSlotMode(mode)) {
					const groupId = groupIdFromSlotMode(anchorId, mode);
					const lastChild = (currentChildren[groupId] ?? []).filter((id) => id !== draggedId).at(-1);

					if (mode === DropMode.LastChild && lastChild) void onDrop(draggedId, lastChild, DropMode.After);
					else void onDrop(draggedId, groupId, DropMode.Into);
				} else {
					void onDrop(draggedId, anchorId, mode);
				}
			}
			cancelAutoExpand();
			stopAutoScroll();
			setDragging(null);
			setDragTarget(null);
		},
		[cancelAutoExpand, stopAutoScroll, setDragging, setDragTarget],
	);

	const onDragCancel = useCallback(() => {
		cancelAutoExpand();
		stopAutoScroll();
		setDragging(null);
		setDragTarget(null);
	}, [cancelAutoExpand, stopAutoScroll, setDragging, setDragTarget]);

	return { sensors, onDragStart, onDragMove, onDragEnd, onDragCancel };
};
