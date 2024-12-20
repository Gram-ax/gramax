import useWatch from "@core-ui/hooks/useWatch";
import { Editor } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { useRef, useState } from "react";
import { Attrs, Mark as MarkType, NodeType } from "./types";

const markList: MarkType[] = ["link", "strong", "em", "code", "file", "comment", "s"];

type State = { actions: NodeType[]; marks: MarkType[]; attrs: Attrs };

export const getNodeNameFromCursor = (editor: Editor) => {
	const { selection } = editor.state;
	const { from, to, empty } = selection;
	let { $anchor } = selection;
	let headingLevel = null;

	const nodeStack = [];
	let ignoreList = false;

	const addRules = {
		bulletList: () => {
			if (!ignoreList) nodeStack.push("bulletList");
			ignoreList = true;
		},
		orderedList: () => {
			if (!ignoreList) nodeStack.push("orderedList");
			ignoreList = true;
		},
		taskList: () => {
			if (!ignoreList) nodeStack.push("taskList");
			ignoreList = true;
		},
		heading: (node) => {
			nodeStack.push("heading");
			headingLevel = node.attrs?.level;
		},
	};

	while ($anchor) {
		const name = $anchor.parent.type.name;

		if (addRules[name]) {
			addRules[name]($anchor.parent);
		} else {
			nodeStack.push(name);
		}

		$anchor = $anchor.node($anchor.depth - 1) ? $anchor.doc.resolve($anchor.before($anchor.depth)) : null;
	}

	if (!nodeStack.some((nodeName) => ["paragraph", "heading", "code_block"].includes(nodeName))) {
		const cursor = editor.state.selection.$from;
		nodeStack.unshift(cursor.nodeAfter?.type?.name || cursor.nodeBefore?.type?.name);
	}

	if (!empty) {
		editor.state.doc.nodesBetween(from, to, (node) => {
			const name = node.type.name;

			if (nodeStack.includes(name)) return;

			if (addRules[name]) {
				addRules[name](node);
			} else {
				nodeStack.push(name);
			}
		});
	}

	return {
		actions: nodeStack.filter(
			(elem) => !["doc", "text", "listItem", "taskItem", "tableHeader", "tableCell", "tableRow"].includes(elem),
		),
		headingLevel,
	};
};

const useType = (editor: Editor) => {
	const mirror = useRef<State>({
		actions: [],
		marks: [],
		attrs: { level: null, notFirstInList: false },
	});

	const [state, setState] = useState<State>({
		actions: [],
		marks: [],
		attrs: { level: null, notFirstInList: false },
	});

	const getMarksAction = () => {
		const node = editor.state.selection.$from.node();
		const marks = [];

		if (node.type.name === "paragraph" || node.type.name === "heading") {
			const { state } = editor;
			const { from, to, empty } = state.selection;

			const addActiveMarks = (marksAtCursor: readonly Mark[]) => {
				marksAtCursor.forEach((mark) => {
					const markName = mark.type.name as MarkType;
					if (markList.includes(markName) && !marks.includes(markName)) {
						marks.push(markName);
					}
				});
			};

			if (empty) {
				const marksAtCursor = state.storedMarks || state.selection.$head.marks();
				addActiveMarks(marksAtCursor);
			} else {
				state.doc.nodesBetween(from, to, (node) => addActiveMarks(node.marks));
			}
		}

		return marks;
	};

	useWatch(() => {
		const { actions, headingLevel } = getNodeNameFromCursor(editor);
		if (headingLevel) mirror.current.attrs.level = headingLevel;

		const marks = getMarksAction();

		const deepDifference =
			state.marks.toString() !== marks.toString() ||
			state.attrs?.level !== mirror.current.attrs?.level ||
			state.attrs.notFirstInList !== mirror.current.attrs.notFirstInList;

		if (actions.toString() !== mirror.current.actions.toString() || deepDifference) {
			mirror.current.actions = [...actions];
			mirror.current.marks = [...marks];

			setState({
				actions: [...mirror.current.actions],
				marks: [...mirror.current.marks],
				attrs: { level: mirror.current.attrs?.level, notFirstInList: mirror.current.attrs?.notFirstInList },
			});
		}
	}, [editor.state.selection, editor.commands]);

	return state;
};

export default useType;
