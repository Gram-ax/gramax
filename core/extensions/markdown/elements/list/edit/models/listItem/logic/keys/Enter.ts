import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import isTypeOf from "@ext/markdown/elementsUtils/isTypeOf";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import { Slice, Fragment } from "prosemirror-model";
import { NodeSelection, Selection } from "prosemirror-state";
import { canSplit } from "prosemirror-transform";

const insideCodeBlock = ({ editor }) => {
	const { node } = getFocusNode(editor.state, (node) => isTypeOf(node, "code_block"));
	if (node) return true;
};

const getListItem = ($from) => {
	let listItem;

	for (let i = $from.depth; i >= 0; i--) {
		const node = $from.node(i);
		if (!["list_item", "task_item"].includes(node.type.name)) continue;
		listItem = node;
		i = -1;
	}

	return listItem;
};

const splitListItem: KeyboardRule = ({ editor, node: { attrs: itemAttrs }, typeName }) => {
	if (insideCodeBlock({ editor })) return false;
	const withoutAttr = typeName === "task_item";

	const { state, view } = editor;
	const { dispatch } = view;
	const itemType = state.schema.nodes[typeName];
	const { $from, $to, node, empty } = state.selection as NodeSelection;

	if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) return false;

	const grandParent = $from.node(-1);
	if (grandParent.type != itemType) return false;

	if ($from.parent.content.size == 0 && $from.node(-1).childCount == $from.indexAfter(-1)) {
		if ($from.depth == 3 || $from.node(-3).type != itemType) return false;

		if ($from.index(-2) != $from.node(-2).childCount - 1) {
			if (empty) {
				const listItem = getListItem($from);

				if (listItem?.textContent.length > 0) {
					const tr = state.tr;

					if (!canSplit(tr.doc, $from.pos, 2)) return false;

					if (dispatch) dispatch(tr.split($from.pos, 2).scrollIntoView());
					return true;
				} else {
					return editor.commands.liftListItem(typeName);
				}
			}

			return false;
		}

		if (dispatch) {
			let wrap = Fragment.empty;
			const depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;

			for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d--)
				wrap = Fragment.from($from.node(d).copy(wrap));
			const depthAfter =
				$from.indexAfter(-1) < $from.node(-2).childCount
					? 1
					: $from.indexAfter(-2) < $from.node(-3).childCount
					? 2
					: 3;

			wrap = wrap.append(Fragment.from(itemType.createAndFill()));
			const start = $from.before($from.depth - (depthBefore - 1));
			const tr = state.tr.replace(start, $from.after(-depthAfter), new Slice(wrap, 4 - depthBefore, 0));
			let sel = -1;
			tr.doc.nodesBetween(start, tr.doc.content.size, (node, pos) => {
				if (sel > -1) return false;
				if (node.isTextblock && node.content.size == 0) sel = pos + 1;
			});

			if (sel > -1) tr.setSelection(Selection.near(tr.doc.resolve(sel)));
			dispatch(tr.scrollIntoView());
		}

		return true;
	}

	if ($from.parent.content.size == 0) {
		if (empty) {
			const listItem = getListItem($from);

			if (listItem?.textContent.length > 0) {
				return editor.commands.liftListItem(typeName);
			}
		}
	}

	const nextType = $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
	const tr = state.tr.delete($from.pos, $to.pos);

	const types = nextType
		? [itemAttrs ? { type: itemType, attrs: withoutAttr ? {} : itemAttrs } : null, { type: nextType }]
		: undefined;

	if (!canSplit(tr.doc, $from.pos, 2, types)) return false;

	if (dispatch) dispatch(tr.split($from.pos, 2, types).scrollIntoView());

	return true;
};

const getEnterShortcuts = (): KeyboardShortcut => {
	return {
		key: "Enter",
		rules: [splitListItem],
	};
};

export default getEnterShortcuts;
