/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import { SCALABLE_NODES } from "@ext/article/extensions/scale/models/Scale";

export const scaleSchemaModifier = (schema: any) => {
	const add = (schema: any) => {
		if (!schema.attrs) {
			schema.attrs = {};
		}

		schema.attrs.scale = { default: null };
	};

	if (schema.nodes) {
		Object.keys(schema.nodes).forEach((name: any) => {
			if (!SCALABLE_NODES.includes(name)) return;
			const node = schema.nodes[name];
			if (name === "text") return;
			if (typeof node === "object" && node !== null) {
				add(node);
			}
		});
	}

	return schema;
};
