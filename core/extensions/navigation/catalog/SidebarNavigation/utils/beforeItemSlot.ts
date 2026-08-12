const BEFORE_ITEM_SLOT_SUFFIX = "::before-item";

export const beforeItemSlotId = (itemId: string): string => `${itemId}${BEFORE_ITEM_SLOT_SUFFIX}`;

export const parseBeforeItemSlotId = (id: string): string | null =>
	id.endsWith(BEFORE_ITEM_SLOT_SUFFIX) ? id.slice(0, -BEFORE_ITEM_SLOT_SUFFIX.length) : null;
