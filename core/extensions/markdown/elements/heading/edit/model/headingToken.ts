import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";

const heading: ParseSpec = {
	block: "heading",
	getAttrs: (tok) => {
		let attrs = {};
		if (tok.attrs?.id) attrs = { id: tok.attrs.id, isCustomId: true };
		return { level: +tok.tag.slice(1), ...attrs };
	},
};

export default heading;
