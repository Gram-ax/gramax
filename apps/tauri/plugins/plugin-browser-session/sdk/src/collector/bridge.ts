import type { AgentBrowserRequest } from "../types";
import { ActionExecutor } from "./actions";
import { defaultCollectorConfig } from "./config";
import { DOMUtils } from "./dom";
import { RoleResolver } from "./roles";
import { TextNormalizer } from "./text";
import { AccessibilityTreeBuilder } from "./tree-builder";
import type { BridgeState, ElementSnapshot, PageSnapshot } from "./types";

const EMPTY_ACCESSIBILITY_TREE = "Empty";

export function createAgentBrowserBridge(windowLike: Window, documentLike: Document) {
	const text = new TextNormalizer(defaultCollectorConfig);
	const dom = new DOMUtils(windowLike, defaultCollectorConfig, text);
	const roles = new RoleResolver(defaultCollectorConfig, dom, text);
	const treeBuilder = new AccessibilityTreeBuilder(
		windowLike,
		documentLike,
		defaultCollectorConfig,
		text,
		dom,
		roles,
	);
	const actions = new ActionExecutor(windowLike, documentLike, dom);

	const state: BridgeState = {
		lastElements: windowLike.__gxAgentBrowserLastElements || {},
	};

	function updateLastElements(interactiveElementsInfo: BridgeState["lastElements"]): void {
		state.lastElements = interactiveElementsInfo;
		windowLike.__gxAgentBrowserLastElements = interactiveElementsInfo;
	}

	function observePage(): PageSnapshot {
		const snapshot = treeBuilder.observePage(EMPTY_ACCESSIBILITY_TREE);
		updateLastElements(snapshot.interactiveElementsInfo);
		return {
			url: snapshot.url,
			title: snapshot.title,
			accessibilityTree: snapshot.accessibilityTree,
			isBottomReached: snapshot.isBottomReached,
		};
	}

	function readElement(elementId: string): ElementSnapshot {
		return {
			elementId: String(elementId),
			element: state.lastElements[String(elementId)] || null,
		};
	}

	const actionHandlers = actions.createActionHandlers(observePage, readElement);

	return {
		observePage: () => observePage(),
		readElement: (elementId: string) => readElement(elementId),
		click: (elementId: string) => actions.clickElement(elementId),
		typeText: (elementId: string, value: string) => actions.typeIntoElement(elementId, value),
		scrollDown: () => actions.scrollDown(),
		handleRequest: (request: AgentBrowserRequest) => actions.handleRequest(request, actionHandlers),
	};
}
