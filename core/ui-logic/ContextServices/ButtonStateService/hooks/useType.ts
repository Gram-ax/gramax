import { getActiveNodesFromSelection } from "@core-ui/ContextServices/ButtonStateService/utils/getActiveNodesFromSelection";
import type { Editor, NodeRange } from "@tiptap/core";
import type { Selection } from "@tiptap/pm/state";
import { getMarksBetween, useEditorState } from "@tiptap/react";
import type { Attrs, Mark, Mark as MarkType, NodeType } from "./types";

type State = { actions: NodeType[]; marks: MarkType[]; attrs: Attrs; selection: Selection };

export const getFilteredActions = (nodes: NodeRange[]) => {
	return nodes
		.filter(
			({ node }) =>
				!["doc", "text", "listItem", "taskItem", "tableHeader", "tableCell", "tableRow"].includes(
					node.type.name,
				),
		)
		.map(({ node }) => node.type.name as NodeType);
};

const arraysEqual = (a: readonly string[], b: readonly string[]) =>
	a.length === b.length && a.every((value, index) => value === b[index]);

const selectionsEqual = (a: Selection | null, b: Selection | null): boolean => {
	if (a === b) return true;
	if (!a || !b) return false;
	return typeof a.eq === "function" ? a.eq(b) : false;
};

const statesEqual = (a: State, b: State | null): boolean => {
	if (!b) return false;
	if (!selectionsEqual(a.selection, b.selection)) return false;
	if (!arraysEqual(a.actions, b.actions) || !arraysEqual(a.marks, b.marks)) return false;
	const aAttrs = a.attrs as Record<string, unknown>;
	const bAttrs = b.attrs as Record<string, unknown>;
	const keys = new Set([...Object.keys(aAttrs), ...Object.keys(bAttrs)]);
	for (const key of keys) if (aAttrs[key] !== bAttrs[key]) return false;
	return true;
};

const useType = (editor: Editor): State => {
	const state = useEditorState({
		editor,
		selector({ editor }) {
			if (!editor?.state) return { actions: [], marks: [], attrs: {}, selection: null };
			const nodes = getActiveNodesFromSelection(editor.state);
			const marks = getMarksBetween(editor.state.selection.from, editor.state.selection.to, editor.state.doc);
			return {
				actions: getFilteredActions(nodes),
				marks: marks.map(({ mark }) => mark.type.name as Mark),
				attrs: {
					level: nodes.find(({ node }) => node.type.name === "heading")?.node?.attrs?.level,
					type: nodes.find(({ node }) => node.type.name === "note")?.node?.attrs?.type,
					diagramName: nodes.find(({ node }) => node.type.name === "diagrams")?.node?.attrs?.diagramName,
					color: marks.find(({ mark }) => mark.type.name === "highlight")?.mark?.attrs?.color,
				},
				selection: editor.state.selection,
			};
		},
		equalityFn: statesEqual,
	});

	return state;
};

export default useType;
