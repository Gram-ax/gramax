import { TextSelection, NodeSelection, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { ResolvedPos } from "@tiptap/pm/model";
const nodeHandlerNativeClick = ["TABLE"];
const notAllowedGap = ["tableCell", "tableHeader"];

export function gapParagraph(): Plugin {
	return new Plugin({
		state: {
			init() {
				return { pos: null };
			},
			apply(tr, prev) {
				const meta = tr.getMeta("gapParagraph");
				if (meta) return { pos: meta.pos };

				return prev;
			},
		},
		props: {
			handleClick,
			handleDOMEvents: {
				click: nativeClick,
			},
		},
		appendTransaction(transactions, oldState, newState) {
			const docChanged = transactions.some((tr) => tr.docChanged);
			const selectionChanged = transactions.some((tr) => tr.selectionSet);

			if (!docChanged && !selectionChanged) {
				return null;
			}

			const pluginState = this.getState(oldState);
			const { pos } = pluginState;
			if (pos === null) return null;

			const newDoc = newState.doc;
			const oldDoc = oldState.doc;

			const newNode = newDoc.nodeAt(pos);
			const oldNode = oldDoc.nodeAt(pos);

			if (!newNode) return newState.tr.setMeta("gapParagraph", { pos: null });
			if (!oldNode) return newState.tr.setMeta("gapParagraph", { pos: null });
			if (!oldNode.eq(newNode)) return newState.tr.setMeta("gapParagraph", { pos: null });

			const nodeStart = pos;
			const nodeEnd = pos + newNode.nodeSize;
			const { from, to } = newState.selection;
			const isOutside = to < nodeStart || from > nodeEnd;

			if (isOutside) return newState.tr.delete(nodeStart, nodeEnd).setMeta("gapParagraph", { pos: null });

			return null;
		},
	});
}

const isValidPos = ($pos: ResolvedPos, force: boolean = false) => {
	const parent = $pos.parent;
	const beforeClosed = closedBefore($pos);
	const afterClosed = closedAfter($pos);
	if (parent.isTextblock || !beforeClosed || !afterClosed) return false;
	const override = parent.type.spec.allowGapCursor || !notAllowedGap.includes(parent.type.name);
	if (override != null) return override;
	if (force) return true;
	const deflt = parent.contentMatchAt($pos.index()).defaultType;
	return deflt && deflt.isTextblock;
};

const createParagraph = (view: EditorView, pos: number, isBottom: boolean = false) => {
	const tr = view.state.tr;
	tr.insert(pos, view.state.schema.nodes.paragraph.create());
	tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
	tr.setMeta("gapParagraph", { pos: pos + (isBottom ? 1 : 0) });
	view.dispatch(tr);
};

const isCloserToTop = (target: HTMLElement, clickY: number): boolean | null => {
	const pos = target.getBoundingClientRect();
	const relativeClickY = clickY - pos.top;
	const elementHeight = pos.bottom - pos.top;

	if (relativeClickY >= elementHeight / 4 && relativeClickY <= (3 * elementHeight) / 4) return null;

	return relativeClickY < elementHeight / 2;
};

const nativeClick = (view: EditorView, event: MouseEvent) => {
	const target = event.target as HTMLElement;
	if (target === view.dom) return false;
	if (!nodeHandlerNativeClick.includes(target.nodeName)) return false;
	const clickPos = view.posAtCoords({ left: event.clientX, top: event.clientY });

	if (!clickPos) return false;
	const $pos = view.state.doc.resolve(Math.min(clickPos.pos, view.state.doc.nodeSize - 1));
	const isValid = isValidPos($pos, true);
	const isTop = isCloserToTop(target, event.clientY);
	if (isTop === null) return false;

	if (!isValid) return false;
	const newPos = Math.min(
		isTop ? $pos.pos - 1 : $pos.pos - $pos.parentOffset + $pos.node($pos.depth).content.size,
		view.state.doc.nodeSize - 1,
	);

	createParagraph(view, newPos, !isTop);
};

const handleClick = (view: EditorView, pos: number, event: MouseEvent) => {
	if (!view || !view.editable) return false;
	const $pos = view.state.doc.resolve(pos);
	const isValid = isValidPos($pos, false);
	if (!isValid) return false;

	const clickPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
	if (clickPos && clickPos.inside > -1 && NodeSelection.isSelectable(view.state.doc.nodeAt(clickPos.inside)!))
		return false;

	createParagraph(view, $pos.pos);
	event.preventDefault();
	event.stopPropagation();

	return true;
};

function closedBefore($pos: ResolvedPos) {
	for (let d = $pos.depth; d >= 0; d--) {
		const index = $pos.index(d),
			parent = $pos.node(d);
		if (index == 0) {
			if (parent.type.spec.isolating) return true;
			continue;
		}
		for (let before = parent.child(index - 1); ; before = before?.lastChild) {
			if (!before) return false;
			if ((before?.childCount == 0 && !before?.inlineContent) || before?.isAtom || before?.type?.spec?.isolating)
				return true;
			if (before?.inlineContent && before?.type?.name !== "paragraph") return false;
		}
	}
	return true;
}

function closedAfter($pos: ResolvedPos) {
	for (let d = $pos.depth; d >= 0; d--) {
		const index = $pos.indexAfter(d),
			parent = $pos.node(d);
		if (index == parent.childCount) {
			if (parent.type.spec.isolating) return true;
			continue;
		}
		for (let after = parent.child(index); ; after = after?.firstChild) {
			if (!after) return false;
			if ((after?.childCount == 0 && !after?.inlineContent) || after?.isAtom || after?.type?.spec?.isolating)
				return true;

			if (after?.inlineContent) return false;
		}
	}
	return true;
}
