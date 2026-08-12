import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { navigationTreeStore } from "../../store/navigationTreeStore";

export const link = (path: string, items?: ItemLink[]): ItemLink =>
	({ ref: { path }, title: path, items }) as unknown as ItemLink;

const INITIAL = navigationTreeStore.getState();

/** Wipes every field a test could have touched, so suites can't leak state into each other. */
export const resetNavigationTreeStore = () => {
	navigationTreeStore.setState(
		{
			...INITIAL,
			flatIndex: {},
			childrenMap: {},
			parentMap: {},
			rootIds: [],
			expanded: new Set<string>(),
			selectedId: "",
			hoveredParentId: null,
			hoveredAnchorId: null,
			draggingId: null,
			dragTarget: null,
			isDragLocked: false,
			onDrop: null,
			onToggle: null,
			onCreateArticle: null,
		},
		true,
	);
};

/**
 * Loads a nested tree through the real `setNavItems`, so childrenMap/parentMap/rootIds are built the same
 * way the app builds them rather than hand-stubbed into a shape the store could never produce.
 */
export const seedTree = (links: ItemLink[]) => navigationTreeStore.getState().setNavItems(links);
