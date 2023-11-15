import { Editor } from "@tiptap/core";
import { useRef, useState, useEffect } from "react";
import { Mark } from "./types";

const topLevelNodes = ["drawio", "image", "video"];

const useType = (editor: Editor) => {
	const test = useRef({
		action: "",
		marks: [] as Mark[],
		attrs: { level: null, notFirstInList: false },
	});
	const [state, setState] = useState({
		action: "",
		marks: [] as Mark[],
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

	const markList: Mark[] = ["link", "strong", "em", "code", "file", "comment"];
	const getMarksAction = () => {
		test.current.marks = [];

		const name = editor.state.selection.$from.node().type.name;
		if (["paragraph", "heading"].includes(name)) {
			test.current.marks = markList.filter((mark) => editor.isActive(mark));
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
	}, [editor.state.selection]);

	return state;
};

export default useType;
