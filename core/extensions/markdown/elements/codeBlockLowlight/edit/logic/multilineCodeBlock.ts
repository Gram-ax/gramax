import type { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { type Command, TextSelection } from "@tiptap/pm/state";

export const multilineCodeBlock =
	(attributes?: Record<string, unknown>): Command =>
	(state, dispatch) => {
		const { $from, $to } = state.selection;
		const range = $from.blockRange($to);
		if (!range) return false;

		const { start, end } = range;

		const paragraphNodes: ProsemirrorNode[] = [];
		state.doc.nodesBetween(start, end, (node) => {
			if (node.type.name === "paragraph") paragraphNodes.push(node);
		});

		const codeContent = paragraphNodes.map((node) => node.textContent).join("\n");
		const codeBlock = state.schema.nodes.code_block.create(
			attributes,
			codeContent ? state.schema.text(codeContent) : undefined,
		);

		if (dispatch) {
			const tr = state.tr.replaceRangeWith(start, end, codeBlock);
			const caret = Math.min(start + codeBlock.nodeSize - 1, tr.doc.content.size);
			tr.setSelection(TextSelection.near(tr.doc.resolve(caret)));
			dispatch(tr);
		}

		return true;
	};
