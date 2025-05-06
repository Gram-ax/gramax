import { findParentNode } from "@tiptap/core";
import { Selection } from "@tiptap/pm/state";
import { editName as blockFieldEditName } from "@ext/markdown/elements/blockContentField/consts";

const checkBlockField = (selection: Selection) => {
	const blockField = findParentNode((node) => node.type.name === blockFieldEditName)(selection);

	if (blockField) {
		return selection.from >= blockField.start && selection.to <= blockField.start + blockField.node.nodeSize;
	}

	return false;
};

export default checkBlockField;
