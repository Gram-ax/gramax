import type { ResolvedPos } from "@tiptap/pm/model";
import { NodeSelection, Plugin, TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

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

			const newNode = newDoc.nodeAt(Math.min(Math.max(pos, 0), newDoc.content.size));
			const oldNode = oldDoc.nodeAt(Math.min(Math.max(pos, 0), oldDoc.content.size));

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

const isValidPos = (Pos: ResolvedPos, force: boolean = false) => {
	const parent = Pos.parent;
	const beforeClosed = closedBefore(Pos);
	const afterClosed = closedAfter(Pos);
	if (parent.isTextblock || !beforeClosed || !afterClosed) return false;
	const override = parent.type.spec.allowGapCursor || !notAllowedGap.includes(parent.type.name);
	if (override != null) return override;
	if (force) return true;
	const deflt = parent.contentMatchAt(Pos.index()).defaultType;
	return deflt && deflt.isTextblock;
};

const createParagraph = (view: EditorView, pos: number, isBottom: boolean = false) => {
	const tr = view.state.tr;
	tr.insert(pos, view.state.schema.nodes.paragraph.create());
	tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
	tr.setMeta("gapParagraph", { pos: pos + (isBottom ? 1 : 0) });
	view.dispatch(tr);
};

const isCloserToTop = (target: HTMLElement, clickY: number): boolean => {
	const pos = target.getBoundingClientRect();
	const relativeClickY = clickY - pos.top;
	const elementHeight = pos.bottom - pos.top;

	if (relativeClickY >= elementHeight / 4 && relativeClickY <= (3 * elementHeight) / 4) return null;

	return relativeClickY < elementHeight / 2;
};

const isCloserToCenter = (target: HTMLElement, clickY: number): boolean => {
	const pos = target.getBoundingClientRect();
	const relativeClickY = clickY - pos.top;
	const elementHeight = pos.bottom - pos.top;

	if (relativeClickY >= elementHeight / 4 && relativeClickY <= (3 * elementHeight) / 4) return true;

	return false;
};

const nativeClick = (view: EditorView, event: MouseEvent) => {
	const target = event.target as HTMLElement;
	if (target === view.dom) return false;
	if (!nodeHandlerNativeClick.includes(target.nodeName)) return false;
	const clickPos = view.posAtCoords({ left: event.clientX, top: event.clientY });

	if (!clickPos) return false;
	const Pos = view.state.doc.resolve(Math.min(clickPos.pos, view.state.doc.nodeSize - 1));
	const isValid = isValidPos(Pos, true);
	const isTop = isCloserToTop(target, event.clientY);
	if (isTop === null) return false;

	if (!isValid) return false;
	const newPos = Math.min(
		isTop ? Pos.pos - 1 : Pos.pos - Pos.parentOffset + Pos.node(Pos.depth).content.size,
		view.state.doc.nodeSize - 1,
	);

	createParagraph(view, newPos, !isTop);
};

const handleClick = (view: EditorView, pos: number, event: MouseEvent) => {
	if (!view || !view.editable) return false;
	const Pos = view.state.doc.resolve(pos);
	const isValid = isValidPos(Pos, false);
	if (!isValid) return false;

	const clickPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
	if (clickPos && clickPos.inside > -1 && NodeSelection.isSelectable(view.state.doc.nodeAt(clickPos.inside)!))
		return false;

	const ClickPos = view.state.doc.resolve(clickPos.pos);
	clickPos.pos =
		ClickPos.node() === view.state.doc && ClickPos.nodeBefore ? ClickPos.after(ClickPos.depth + 1) : clickPos.pos;

	const target = view.nodeDOM(clickPos.pos) as HTMLElement;
	if (!target || target === view.dom) return false;
	if (isCloserToCenter(target, event.clientY)) return false;

	createParagraph(view, Pos.pos);
	event.preventDefault();
	event.stopPropagation();

	return true;
};

function closedBefore(Pos: ResolvedPos) {
	for (let d = Pos.depth; d >= 0; d--) {
		const index = Pos.index(d),
			parent = Pos.node(d);
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

function closedAfter(Pos: ResolvedPos) {
	for (let d = Pos.depth; d >= 0; d--) {
		const index = Pos.indexAfter(d),
			parent = Pos.node(d);
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
