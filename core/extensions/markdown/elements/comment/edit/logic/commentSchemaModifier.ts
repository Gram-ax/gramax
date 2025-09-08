import { COMMENT_NODE_TYPES } from "@ext/markdown/elements/comment/edit/model/consts";

const commentSchemaModifier = (schema: any) => {
	const add = (schema: any) => {
		if (!schema.attrs) {
			schema.attrs = {};
		}

		schema.attrs.comment = { default: { id: null } };
	};

	if (schema.nodes) {
		Object.keys(schema.nodes).forEach((name: any) => {
			if (!COMMENT_NODE_TYPES.includes(name)) return;
			const node = schema.nodes[name];
			if (name === "text") return;
			if (typeof node === "object" && node !== null) {
				add(node);
			}
		});
	}

	if (schema.marks) {
		Object.keys(schema.marks).forEach((name: any) => {
			if (!COMMENT_NODE_TYPES.includes(name)) return;
			const mark = schema.marks[name];
			if (typeof mark === "object" && mark !== null) {
				add(mark);
			}
		});
	}

	return schema;
};

export default commentSchemaModifier;
