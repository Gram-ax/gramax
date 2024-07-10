import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { Config, Node, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";
import isInline from "../../../../elementsUtils/isInlineChildren";

export const cut: Schema = {
	render: "Cut",
	attributes: {
		text: { type: String },
		expanded: { type: String },
	},
	type: SchemaType.variable,
	selfClosing: false,
	transform: async (node: Node, config: Config) => {
		const children = await node.transformChildren(config);
		const inline = isInline(children);
		const text = node.attributes.text ?? "";
		if (inline) {
			return new Tag("Cut", { text, isInline: true, expanded: node.attributes.expanded === "true" }, children);
		} else {
			return new Tag("Note", { title: text, collapsed: true, type: NoteType.hotfixes }, children);
		}
	},
};
