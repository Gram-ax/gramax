import { DropMode } from "./dropMode";

/**
 * Groups expose two droppable slots that are not tree items — one above the first child and one below the
 * last. Their dnd ids are the group id plus a suffix, so a slot id can be turned back into the group it
 * belongs to.
 */
export enum GroupSlotSuffix {
	First = "__first",
	Last = "__last",
}

export const firstSlotId = (groupId: string): string => `${groupId}${GroupSlotSuffix.First}`;
export const lastSlotId = (groupId: string): string => `${groupId}${GroupSlotSuffix.Last}`;

const SLOT_MODES: Record<GroupSlotSuffix, DropMode.FirstChild | DropMode.LastChild> = {
	[GroupSlotSuffix.First]: DropMode.FirstChild,
	[GroupSlotSuffix.Last]: DropMode.LastChild,
};

export type GroupSlot = {
	groupId: string;
	mode: DropMode.FirstChild | DropMode.LastChild;
};

/** Splits a droppable id into its group and drop mode; `null` when the id is a plain tree item. */
export const parseGroupSlotId = (droppableId: string): GroupSlot | null => {
	for (const suffix of Object.values(GroupSlotSuffix)) {
		if (!droppableId.endsWith(suffix)) continue;
		return { groupId: droppableId.slice(0, -suffix.length), mode: SLOT_MODES[suffix] };
	}
	return null;
};

/** Recovers the group id a `first-child` / `last-child` drag target was built from. */
export const groupIdFromSlotMode = (anchorId: string, mode: DropMode.FirstChild | DropMode.LastChild): string => {
	const suffix = mode === DropMode.FirstChild ? GroupSlotSuffix.First : GroupSlotSuffix.Last;
	return anchorId.slice(0, -suffix.length);
};
