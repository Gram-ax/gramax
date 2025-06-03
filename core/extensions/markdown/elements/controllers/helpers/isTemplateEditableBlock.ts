import { findParentNode } from "@tiptap/core";
import { Selection } from "@tiptap/pm/state";
import { editName as BLOCK_FIELD } from "@ext/markdown/elements/blockContentField/consts";
import { editName as BLOCK_PROPERTY } from "@ext/markdown/elements/blockProperty/consts";

const isTemplateEditableBlock = (selection: Selection) => {
	const blockField = findParentNode((node) => node.type.name === BLOCK_FIELD || node.type.name === BLOCK_PROPERTY)(
		selection,
	);

	if (blockField) {
		return selection.from >= blockField.start && selection.to <= blockField.start + blockField.node.nodeSize;
	}

	return false;
};

export default isTemplateEditableBlock;
