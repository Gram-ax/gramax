import CellComponent from "@ext/markdown/elements/table/edit/components/CellComponent";
import { type Editor, getRenderedAttributes, type NodeViewRenderer, type NodeViewRendererProps } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView, NodeView } from "@tiptap/pm/view";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TableMap } from "prosemirror-tables";

type GetPos = () => number | undefined;
type CellAttrs = Record<string, string>;
type CellPositionInfo = NonNullable<ReturnType<typeof getCellPositionInfo>>;

const STICKY_FIRST_COLUMN_CELL_ATTR = "data-sticky-first-column-cell";
const STICKY_AFTER_FIRST_COLUMN_CELL_ATTR = "data-sticky-after-first-column-cell";

const getCellPositionInfo = (view: EditorView, getPos: GetPos) => {
	const pos = getPos();
	if (typeof pos !== "number") return null;

	const resolvedPos = view.state.doc.resolve(pos);
	const table = resolvedPos.node(-1);
	const tableStart = resolvedPos.start(-1);
	const layoutColIndex = TableMap.get(table).colCount(pos - tableStart);

	return {
		cellIndex: resolvedPos.index(resolvedPos.depth),
		isFirstLayoutColumn: layoutColIndex === 0,
		layoutColIndex,
		rowIndex: resolvedPos.index(resolvedPos.depth - 1),
	};
};

const getCellAttrs = (editor: Editor, node: ProseMirrorNode): CellAttrs => {
	const HTMLAttributes = getRenderedAttributes(node, editor.extensionManager.attributes);
	const attrs = Object.entries(HTMLAttributes).filter(([, value]) => value);
	const newAttrs: CellAttrs = {};
	attrs.forEach(([name, value]) => {
		newAttrs[name] = String(value);
	});
	return newAttrs;
};

const getStickyCellAttrs = (cellPosition: CellPositionInfo | null): CellAttrs => {
	if (!cellPosition) return {};

	return {
		...(cellPosition.layoutColIndex === 0 ? { [STICKY_FIRST_COLUMN_CELL_ATTR]: "true" } : {}),
		...(cellPosition.layoutColIndex === 1 ? { [STICKY_AFTER_FIRST_COLUMN_CELL_ATTR]: "true" } : {}),
	};
};

const getNodeViewCellAttrs = (props: { editor: Editor; node: ProseMirrorNode; stickyAttrs: CellAttrs }): CellAttrs => ({
	...getCellAttrs(props.editor, props.node),
	...props.stickyAttrs,
});

const syncClassAttr = (dom: HTMLElement, prevClass = "", nextClass = "") => {
	const prevClasses = prevClass.split(/\s+/).filter(Boolean);
	const nextClasses = nextClass.split(/\s+/).filter(Boolean);
	const nextSet = new Set(nextClasses);

	prevClasses.forEach((className) => {
		if (!nextSet.has(className)) dom.classList.remove(className);
	});
	nextClasses.forEach((className) => dom.classList.add(className));
};

const updateCellAttrs = (dom: HTMLElement, prevAttrs: CellAttrs, nextAttrs: CellAttrs) => {
	Object.keys(prevAttrs).forEach((name) => {
		if (name === "class") return syncClassAttr(dom, prevAttrs.class, nextAttrs.class);
		if (!(name in nextAttrs)) dom.removeAttribute(name);
	});

	Object.entries(nextAttrs).forEach(([name, value]) => {
		if (name === "class") return syncClassAttr(dom, prevAttrs.class, value);
		if (dom.getAttribute(name) !== value) dom.setAttribute(name, value);
	});

	return nextAttrs;
};

const syncStickyCellAttrs = (dom: HTMLElement, stickyAttrs: CellAttrs) => {
	for (const name of [STICKY_FIRST_COLUMN_CELL_ATTR, STICKY_AFTER_FIRST_COLUMN_CELL_ATTR]) {
		const value = stickyAttrs[name];
		if (value) dom.setAttribute(name, value);
		else dom.removeAttribute(name);
	}
};

const createPlainCellNodeView = (props: NodeViewRendererProps, stickyAttrs: CellAttrs): NodeView => {
	const dom = document.createElement("td");
	let currentNode = props.node;
	let attrs = updateCellAttrs(
		dom,
		{},
		getNodeViewCellAttrs({ editor: props.editor, node: currentNode, stickyAttrs }),
	);

	return {
		dom,
		contentDOM: dom,
		update: (node) => {
			if (node.type !== currentNode.type) return false;

			const cellPosition = getCellPositionInfo(props.view, props.getPos);
			if (cellPosition?.rowIndex === 0) return false;

			currentNode = node;
			attrs = updateCellAttrs(
				dom,
				attrs,
				getNodeViewCellAttrs({
					editor: props.editor,
					node: currentNode,
					stickyAttrs: getStickyCellAttrs(cellPosition),
				}),
			);
			return true;
		},
	};
};

export const createTableCellNodeView = (): NodeViewRenderer => {
	const renderReactCell = (stickyAttrs: CellAttrs) =>
		ReactNodeViewRenderer(CellComponent, {
			as: "td",
			attrs: ({ HTMLAttributes }) => {
				const newAttrs: Record<string, string> = { ...stickyAttrs };
				for (const [name, value] of Object.entries(HTMLAttributes)) {
					if (value !== undefined && value !== false && value !== "") newAttrs[name] = value;
				}
				return newAttrs;
			},
			stopEvent: () => false,
		});

	return (props) => {
		const cellPosition = getCellPositionInfo(props.view, props.getPos);
		const stickyAttrs = getStickyCellAttrs(cellPosition);

		if (cellPosition?.rowIndex === 0) {
			const nodeView = renderReactCell(stickyAttrs)(props);
			const update = nodeView.update?.bind(nodeView);

			if (update) {
				nodeView.update = (node, decorations, innerDecorations) => {
					const updated = update(node, decorations, innerDecorations);
					if (updated) {
						syncStickyCellAttrs(
							nodeView.dom as HTMLElement,
							getStickyCellAttrs(getCellPositionInfo(props.view, props.getPos)),
						);
					}
					return updated;
				};
			}

			return nodeView;
		}
		return createPlainCellNodeView(props, stickyAttrs);
	};
};
