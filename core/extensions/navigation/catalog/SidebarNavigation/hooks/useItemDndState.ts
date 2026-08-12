import { useNavigationTreeStore } from "../store/navigationTreeStore";
import { DropMode } from "../utils/dropMode";

export function useItemDndState(id: string) {
	const { isDragging, isInsertionTarget, isDragTarget, dropMode, isDragLocked, showsDragLine, isDragAnchor } =
		useNavigationTreeStore((s) => ({
			isDragging: s.draggingId === id,
			isInsertionTarget: s.hoveredParentId === id,
			isDragTarget:
				(s.dragTarget?.anchorId === id &&
					(s.dragTarget.mode === DropMode.Into || s.dragTarget.mode === DropMode.FirstChild)) ||
				s.dragTarget?.parentId === id,
			dropMode: s.dragTarget?.anchorId === id && s.dragTarget.mode,
			isDragLocked: s.isDragLocked,
			showsDragLine: s.dragLineIds.has(id),
			isDragAnchor: s.dragTarget?.mode === DropMode.After && s.dragTarget.anchorId === id,
		}));

	return {
		isDragging,
		isInsertionTarget,
		isDragTarget,
		dropMode,
		showsDragLine,
		isDragAnchor,
		isDragLocked,
	};
}

export type DragLineState = Pick<ReturnType<typeof useItemDndState>, "showsDragLine" | "isDragAnchor">;
