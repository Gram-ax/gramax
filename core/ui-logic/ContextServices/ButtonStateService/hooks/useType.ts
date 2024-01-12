import { Editor } from "@tiptap/core";
import { useRef, useState, useEffect } from "react";
import { Mark as MarkType } from "./types";
import { Mark } from "@tiptap/pm/model";

const topLevelNodes = ["drawio", "image", "video"];

const markList: MarkType[] = ["link", "strong", "em", "code", "file", "comment"];

const useType = (editor: Editor) => {
	const test = useRef({
		action: "",
		marks: [] as MarkType[],
		attrs: { level: null, notFirstInList: false },
	});
	const [state, setState] = useState({
		action: "",
		marks: [] as MarkType[],
		attrs: { level: null, notFirstInList: false },
	});

	const getNodeNameFromCursor = () => {
		const cursor = editor.state.selection.$from;
		const node = cursor.node();
		const depth = cursor.depth;
		const nodeName = node.type.name;

		test.current.attrs = { level: null, notFirstInList: false };

		if (topLevelNodes.includes(cursor.nodeAfter?.type?.name)) {
			return (test.current.action = cursor.nodeAfter.type.name);
		}

		if (depth <= 2) {
			const firstLevel = cursor.node(1);
			if (firstLevel?.attrs) test.current.attrs.level = firstLevel.attrs.level;
			return (test.current.action = nodeName === "paragraph" ? firstLevel.type.name : nodeName);
		}

		const oneDeepNode = cursor.node(-1);

		if (nodeName !== "paragraph") {
			return (test.current.action = nodeName);
		}

		if (oneDeepNode.type.name !== "list_item") {
			return (test.current.action = oneDeepNode.type.name);
		}

		test.current.attrs.notFirstInList = node !== oneDeepNode.firstChild;
		test.current.action = cursor.node(-2).type.name;
	};

	const getMarksAction = () => {
		test.current.marks = [];

		function getActiveMarksInSelection(markTypes: MarkType[]) {
			const { state } = editor;
			const { from, to, empty } = state.selection;

			const addActiveMarks = (marks: readonly Mark[]) => {
				marks.forEach((mark) => {
					const markName = mark.type.name as MarkType;
					if (markTypes.includes(markName) && !test.current.marks.includes(markName)) {
						test.current.marks.push(markName);
					}
				});
			};

			if (empty) {
				const marksAtCursor = state.storedMarks || state.selection.$head.marks();
				addActiveMarks(marksAtCursor);
			} else {
				state.doc.nodesBetween(from, to, (node) => {
					addActiveMarks(node.marks);
				});
			}
		}

		const node = editor.state.selection.$from.node();
		if (["paragraph", "heading"].includes(node.type.name)) {
			getActiveMarksInSelection(markList);
		}
	};

	useEffect(() => {
		getNodeNameFromCursor();
		getMarksAction();

		const { marks, attrs, action } = test.current;
		const deepDifference =
			state.marks.toString() !== marks.toString() ||
			state.attrs?.level !== attrs?.level ||
			state.attrs.notFirstInList !== attrs.notFirstInList;

		if (state.action !== action || deepDifference) {
			setState({
				action,
				marks: [...marks],
				attrs: { level: attrs.level, notFirstInList: attrs.notFirstInList },
			});
		}
	}, [editor.state.selection, editor.commands]);

	return state;
};

export default useType;
