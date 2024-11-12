import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import { useContext } from "react";
import { ActionContext } from "../ButtonStateService";
import { Attrs, ButtonState, Mark, NodeType, NodeValues } from "./types";

const Block = ["heading", "ordered_list", "bullet_list", "task_list"];
const BlockPlus = ["table", "cut", "note", "tab", "tabs", "blockquote"];
const BlockOutContent = ["drawio", "diagrams", "image", "video", "code_block", "snippet", OPEN_API_NAME];

const disabledMarkRule: Record<Mark, Mark[]> = {
	code: ["link", "file", "comment", "strong", "em"],
	comment: ["link", "file", "comment", "code"],
	file: ["link", "file", "comment", "code"],
	link: ["file", "comment", "code"],
	strong: ["code"],
	em: ["code"],
	s: ["code"],
};

const disableBlockRule = {
	ordered_list: (buttonNode) => ["heading", ...BlockPlus].includes(buttonNode),
	bullet_list: (buttonNode) => ["heading", ...BlockPlus].includes(buttonNode),
	task_list: (buttonNode) => ["heading", ...BlockPlus].includes(buttonNode),
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
	if (Boolean(contextAttrs.level) && Boolean(buttonAttrs?.level)) {
		if (contextAttrs.level !== buttonAttrs.level) {
			result.isActive = false;
		}
	}
}

function changeResultByMark(activeNode: NodeType, buttonMark, result: ButtonState) {
	if (!result.disabled && buttonMark) {
		result.disabled = disabledMarkByAction[activeNode]?.();
	}
}

function getButtonStateByMarks(contextMarks: Mark[], buttonMark: Mark, result: ButtonState) {
	if (!contextMarks) return;

	if (buttonMark) {
		if (!result.isActive) {
			result.isActive = contextMarks.includes(buttonMark);
		}
		if (!result.disabled) {
			result.disabled = disabledMarkRule[buttonMark]?.some((mark) => contextMarks.includes(mark)) || false;
		}
	}
}

const useCurrentAction = (current: NodeValues) => {
	const { actions, attrs, marks } = useContext(ActionContext);

	const result = { isActive: false, disabled: false };

	actions.forEach((action) => {
		changeResultByAction(action, current.action, result);
		changeResultByMark(action, current.mark, result);
		changeResultByAttrs(attrs, current.attrs, result);
		getButtonStateByMarks(marks, current.mark, result);
	});

	return result;
};

export default useCurrentAction;
