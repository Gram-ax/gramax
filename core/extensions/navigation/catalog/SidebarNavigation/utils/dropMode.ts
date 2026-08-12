/** Where a dragged item lands relative to the anchor the pointer is over. */
export enum DropMode {
	/** Sibling directly above the anchor. */
	Before = "before",
	/** Sibling directly below the anchor. */
	After = "after",
	/** Child of the anchor. */
	Into = "into",
	/** First child of the group the anchor slot belongs to. */
	FirstChild = "first-child",
	/** Last child of the group the anchor slot belongs to. */
	LastChild = "last-child",
	/** Last root item in the navigation tree. */
	LastRoot = "last-root",
}

/** The subset the backend accepts: group slots are resolved to one of these before `onDrop`. */
export type PersistedDropMode = DropMode.Before | DropMode.After | DropMode.Into;

export const isGroupSlotMode = (mode: DropMode): mode is DropMode.FirstChild | DropMode.LastChild =>
	mode === DropMode.FirstChild || mode === DropMode.LastChild;
