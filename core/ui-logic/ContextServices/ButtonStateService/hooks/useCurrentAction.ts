import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import { useContext } from "react";
import { ActionContext } from "../ButtonStateService";
import { Attrs, ButtonState, Mark, NodeType, NodeValues } from "./types";
import { Selection } from "@tiptap/pm/state";
import { CellSelection } from "prosemirror-tables";

const Block = ["heading", "orderedList", "bulletList", "taskList"];
const BlockPlus = ["table", "cut", "note", "tab", "tabs", "blockquote"];
const BlockOutContent = ["drawio", "diagrams", "image", "video", "code_block", "snippet", OPEN_API_NAME];
const ListGroup = ["orderedList", "bulletList", "taskList"];

const disabledMarkRule: Record<Mark, Mark[]> = {
	code: ["link", "file", "comment"],
	comment: ["link", "file", "comment", "code"],
	file: ["link", "file", "comment", "code"],
	link: ["file", "comment", "code"],
	strong: ["code"],
	em: ["code"],
	s: [],
};

const disableBlockRule = {
	orderedList: (buttonNode) => ["heading", "taskList", "code_block", ...BlockPlus].includes(buttonNode),
	bulletList: (buttonNode) => ["heading", "taskList", "code_block", ...BlockPlus].includes(buttonNode),
	taskList: (buttonNode) => ["heading", "code_block", ...BlockPlus].includes(buttonNode),
};

const disableBlockBySelection = {
	table: (selection, buttonNode) => selection instanceof CellSelection && ListGroup.includes(buttonNode),
};

const disabledMarkByAction = {
	code_block: () => true,
};

function changeResultByAction(activeNode: NodeType, buttonNode: NodeType, result: ButtonState) {
	if (!result.isActive) {
		result.isActive = activeNode === buttonNode;
	}

	if (result.disabled) return;

	if (BlockOutContent.includes(activeNode)) {
		if (activeNode === "code_block" && activeNode === buttonNode) {
			result.disabled = false;
		} else {
			result.disabled = true;
		}
	} else if (BlockPlus.includes(activeNode)) {
		result.disabled = BlockPlus.includes(buttonNode) || buttonNode === "heading";
	} else if (Block.includes(activeNode)) {
		result.disabled = disableBlockRule?.[activeNode]?.(buttonNode);
	}
}

function changeResultByAttrs(contextAttrs: Partial<Attrs>, buttonAttrs: Partial<Attrs>, result: ButtonState) {
	if (Boolean(contextAttrs?.level) && Boolean(buttonAttrs?.level)) {
		if (contextAttrs.level !== buttonAttrs.level) {
			result.isActive = false;
		}
	}

	if (Boolean(contextAttrs?.type) && Boolean(buttonAttrs?.type)) {
		if (contextAttrs.type !== buttonAttrs.type) {
			result.isActive = false;
		}
	}
}

function changeResultByMark(activeNode: NodeType, buttonMark, result: ButtonState) {
	if (!result.disabled && buttonMark) {
		result.disabled = disabledMarkByAction[activeNode]?.();
	}
}

function changeResultBySelection(
	activeNode: NodeType,
	selection: Selection,
	buttonNode: NodeType,
	result: ButtonState,
) {
	if (!(activeNode in disableBlockBySelection)) return;

	if (disableBlockBySelection[activeNode]?.(selection, buttonNode)) {
		result.disabled = true;
	}
}

function getButtonStateByMarks(contextMarks: Mark[], buttonMark: Mark, result: ButtonState) {
	if (!contextMarks || !contextMarks.length) return;

	if (buttonMark) {
		if (!result.isActive) {
			result.isActive = contextMarks.includes(buttonMark);
		}
		if (!result.disabled) {
			result.disabled = disabledMarkRule[buttonMark]?.some((mark) => contextMarks.includes(mark)) || false;
		}
	}
}

interface ResultByActionDataProps {
	actions?: NodeType[];
	attrs?: Partial<Attrs>;
	marks?: Mark[];
	currentNode: NodeValues;
	selection: Selection;
}

export const getResultByActionData = (props: ResultByActionDataProps) => {
	const { currentNode: current, attrs, marks, actions, selection } = props;
	const result = { isActive: false, disabled: false };

	actions.forEach((action) => {
		changeResultByAction(action, current.action, result);
		changeResultByMark(action, current.mark, result);
		changeResultByAttrs(attrs, current.attrs, result);
		changeResultBySelection(action, selection, current.action, result);
		getButtonStateByMarks(marks, current.mark, result);
	});

	return result;
};

const useCurrentAction = (currentNode: NodeValues) => {
	const { actions, attrs, marks, selection } = useContext(ActionContext);

	return getResultByActionData({ actions, attrs, marks, currentNode, selection });
};

export default useCurrentAction;
