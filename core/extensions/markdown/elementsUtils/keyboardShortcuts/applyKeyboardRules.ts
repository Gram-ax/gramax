import { KeyboardShortcutCommand } from "@tiptap/core";
import getFocusNode from "../getFocusNode";
import isTypeOf from "../isTypeOf";
import KeyboardRule from "./model/KeyboardRule";

const applyKeyboardRules = (
	keyboardRules: KeyboardRule[],
	focusShoudBeInsideNode = true,
	typeName?: string,
): KeyboardShortcutCommand => {
	return ({ editor }) => {
		const state = editor.state;
		const { node, parentNode, position } = getFocusNode(
			state,
			typeName ? (node) => isTypeOf(node, typeName) : () => true,
		);
		if (focusShoudBeInsideNode && !node) return false;

		for (const func of keyboardRules) {
			if (func({ editor, typeName, node, parentNode, nodePosition: position })) return true;
		}

		return false;
	};
};

export default applyKeyboardRules;
