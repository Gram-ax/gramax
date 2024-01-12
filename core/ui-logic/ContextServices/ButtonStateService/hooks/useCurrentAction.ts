import { Mark } from "./types";
import { NodeValues } from "./types";
import { useContext } from "react";
import { ActionContext } from "../ButtonStateService";

const canBeWrapper = ["note", "blockquote", "cut"];
const tableFields = ["tableCell", "tableHeader"];
const marks = ["link", "strong", "em", "code", "file", "comment"];
const listRules = ["bullet_list", "ordered_list", "filesMenuGroup", "code_block", ...marks];

const useCurrentAction = (current: NodeValues) => {
	const context = useContext(ActionContext);
	const { action, attrs, mark } = current;
	const actions = Array.isArray(action) ? action : [action];
	const result = { isActive: false, disabled: false };
	const notFirstInList = context.attrs?.notFirstInList || false;

	const disabledActionRule = {
		ordered_list: (props) => (notFirstInList ? props === "heading" : !listRules.includes(props)),
		bullet_list: (props) => (notFirstInList ? props === "heading" : !listRules.includes(props)),
		diagrams: (props) => ![...canBeWrapper, "diagramsMenuGroup"].includes(props),
		drawio: (props) => ![...canBeWrapper, "diagramsMenuGroup"].includes(props),
		image: (props) => ![...canBeWrapper].includes(props),
		video: (props) => ![...canBeWrapper].includes(props),
		tableHeader: (props) => [...tableFields, "heading"].includes(props),
		tableCell: (props) => [...tableFields, "heading"].includes(props),
		heading: (props) => !["heading", ...marks].includes(props),
		code_block: (props) => !["code_block", "code"].includes(props),
		blockquote: (props) => props === "heading",
		note: (props) => props === "heading",
		cut: (props) => props === "heading",
	};

	const activeActionRule = {
		drawio: (props) => ["diagramsMenuGroup", "diagrams.net"].includes(props),
		table: (props) => tableFields.includes(props),
		diagrams: (props) => props === "diagramsMenuGroup",
		code_block: (props) => props === "code_block",
	};

	const disabledMarkRule = {
		link: () => ["link", "file", "comment", "code"].some((mark) => context.marks.includes(mark as Mark)),
		file: () => ["link", "file", "comment", "code"].some((mark) => context.marks.includes(mark as Mark)),
		comment: () => ["link", "file", "comment", "code"].some((mark) => context.marks.includes(mark as Mark)),
	};

	if (mark) {
		result.isActive = context.marks.includes(mark);
		result.disabled = disabledMarkRule[mark]?.();
	}

	if (context.action) {
		actions.forEach((action) => {
			const props = action ?? mark;
			if (!result.isActive) {
				result.isActive = action === context.action || activeActionRule[context.action]?.(props);
			}
			if (!result.disabled) {
				result.disabled = disabledActionRule[context.action]?.(props);
			}
		});
	}

	if (attrs?.level) {
		result.isActive = attrs.level === context.attrs?.level;
	}

	return result;
};

export default useCurrentAction;
