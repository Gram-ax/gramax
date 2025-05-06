import { mergeAttributes, Node } from "@tiptap/core";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { colgroup, col } from "../tableSchema";

const Col = Node.create({
	...getExtensionOptions({ schema: col, name: "col" }),

	parseHTML() {
		return [{ tag: "col" }];
	},
	renderHTML({ HTMLAttributes }) {
		return ["col", mergeAttributes(HTMLAttributes)];
	},
});

const Colgroup = Node.create({
	...getExtensionOptions({ schema: colgroup, name: "colgroup" }),

	parseHTML() {
		return null;
	},
	renderHTML() {
		return ["colgroup", {}, 0];
	},
});

export default [Col, Colgroup];
