import { FLOAT_NODES } from "@ext/markdown/elements/float/edit/model/consts";

const floatSchemaModifier = (schema: any) => {
	const add = (schema: any) => {
		if (!schema.attrs) {
			schema.attrs = {};
		}

		schema.attrs.float = { default: null };
	};

	if (schema.nodes) {
		Object.keys(schema.nodes).forEach((name: any) => {
			if (!FLOAT_NODES.includes(name)) return;
			const node = schema.nodes[name];
			if (name === "text") return;
			if (typeof node === "object" && node !== null) {
				add(node);
			}
		});
	}

	if (schema.marks) {
		Object.keys(schema.marks).forEach((name: any) => {
			if (!FLOAT_NODES.includes(name)) return;
			const mark = schema.marks[name];
			if (typeof mark === "object" && mark !== null) {
				add(mark);
			}
		});
	}

	return schema;
};

export default floatSchemaModifier;
