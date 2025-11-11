import LinkHoverTooltip from "@ext/markdown/elements/link/edit/logic/LinkHoverTooltip";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import PageDataContext from "@core/Context/PageDataContext";
import { LinkHoverTooltipManager } from "@ext/markdown/elements/link/edit/logic/LinkHoverTooltipManager";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { Mark } from "@tiptap/pm/model";
import { Editor } from "@tiptap/core";

export type MarkWithPos = { mark: Mark; from: number; to: number };

const getMarksWithPositions = (node: Node, startPos: number): MarkWithPos[] => {
	const data: MarkWithPos[] = [];

	node.descendants((node, pos) => {
		if (!node.marks) return;
		node.marks.forEach((mark) => {
			data.push({ mark, from: pos + startPos, to: pos + node.nodeSize + startPos });
		});
	});

	return data;
};

const findMarkAtPosition = (marks: MarkWithPos[], markName: string, pos: number): MarkWithPos | undefined => {
	return marks.find((data) => {
		if (pos >= data.from && data.to >= pos) {
			return data.mark.type.name === markName;
		}
		return false;
	});
};

const getLinkMarkByView = (view: EditorView, x: number, y: number) => {
	const { pos: cursorPos, inside: parentNodePos } = view.posAtCoords({ left: x, top: y });

	const resolvedPos = view.state.doc.resolve(cursorPos);
	const marksWithPositions = getMarksWithPositions(resolvedPos.node(), resolvedPos.start());

	return { ...findMarkAtPosition(marksWithPositions, "link", cursorPos), parentNodePos };
};

export function hoverTooltip(
	editor: Editor,
	apiUrlCreator: ApiUrlCreator,
	pageDataContext: PageDataContext,
): Plugin {
	const tooltipManager = new LinkHoverTooltipManager(document.body, apiUrlCreator, pageDataContext);

	editor.on("selectionUpdate", (editor) => {
		const cursorPos = editor.editor.view.state.selection.anchor;
		tooltipManager.updateAnchorPos(cursorPos);
	});

	editor.on("blur", () => {
		tooltipManager.updateAnchorPos(null);
	});

	editor.on("destroy", () => {
		tooltipManager.destroyAll();
	});

	return new Plugin({
		props: {
			handleDOMEvents: {
				mouseover: (view, event) => {
					const target = event.target as HTMLElement;
					const linkElement = target.closest("a");

					if (linkElement && linkElement.closest(".ProseMirror")) {
						const { clientX, clientY } = event;

						const markWithPosition = getLinkMarkByView(view, clientX, clientY);
						if (!markWithPosition.mark) return;

						tooltipManager.createTooltip({
							linkElement,
							markData: markWithPosition,
							anchorPos: view.state.selection.anchor,
						});
					}
				},
			},
		},
		key: new PluginKey("hoverTooltip"),
	});
}
