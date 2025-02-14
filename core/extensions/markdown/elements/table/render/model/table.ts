import { Schema, Tag } from "@ext/markdown/core/render/logic/Markdoc";

export const thead: Schema = {
	render: "thead",
};

export const table: Schema = {
	render: "Table",
	transform: async (node, config) => {
		return new Tag("Table", node.attributes, await node.transformChildren(config));
	},
};

export const tbody: Schema = {
	render: "tbody",
};

export const tr: Schema = {
	render: "tr",
};

export const td: Schema = {
	render: "Td",
	transform: async (node, config) => {
		return new Tag("Td", node.attributes, await node.transformChildren(config));
	},
};
