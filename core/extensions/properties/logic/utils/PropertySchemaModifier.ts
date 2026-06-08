/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import { PROPERTY_NODES } from "@ext/properties/models/consts";

export const propertySchemaModifier = (schema: any) => {
	const add = (schema: any) => {
		if (!schema.attrs) {
			schema.attrs = {};
		}

		schema.attrs.property = { default: null };
	};

	if (schema.nodes) {
		Object.keys(schema.nodes).forEach((name: any) => {
			if (!PROPERTY_NODES.includes(name)) return;
			const node = schema.nodes[name];
			if (name === "text") return;
			if (typeof node === "object" && node !== null) {
				add(node);
			}
		});
	}

	return schema;
};
