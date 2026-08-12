import type { InteractiveElementInfo } from "../types";

export interface BridgeState {
	lastElements: Record<string, InteractiveElementInfo>;
}

export interface TreeState {
	elementCounter: number;
	interactiveElementsInfo: Record<string, InteractiveElementInfo>;
	seenElements: WeakSet<Element>;
}

export interface PageSnapshot {
	url: string;
	title: string;
	accessibilityTree: string;
	isBottomReached: boolean;
}

export interface ElementSnapshot {
	elementId: string;
	element: InteractiveElementInfo | null;
}

export interface AccessibleName {
	name: string;
	fromContents: boolean;
}

export interface TextTreeNode {
	kind: "text";
	text: string;
	sealed: boolean;
}

export interface ElementTreeNode {
	kind: "element";
	role: string;
	name?: string;
	attributes?: string[];
	children: TreeNode[];
	inline: boolean;
	id?: number;
	embedName?: string;
}

export type TreeNode = TextTreeNode | ElementTreeNode;
