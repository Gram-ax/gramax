import { findParentNode, type RawCommands } from "@tiptap/core";
import { editName } from "../../../consts";

export const setQuestionRequired: RawCommands["setQuestionRequired"] =
	(required: boolean) =>
	({ commands }) => {
		return commands.command(({ tr, dispatch }) => {
			const pos = tr.selection.from;
			const parentNode = findParentNode((node) => node.type.name === editName)(tr.selection);
			if (!parentNode) return false;
			tr.setNodeAttribute(pos, "required", required);
			dispatch?.(tr);
			return true;
		});
	};
