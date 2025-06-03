import { Schema, SchemaType, Tag } from "@ext/markdown/core/render/logic/Markdoc";

export const thead: Schema = {
	render: "thead",
};

export const table: Schema = {
	render: "Table",
	attributes: {
		header: { type: String },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		return new Tag("Table", node.attributes, await node.transformChildren(config));
	},
};

export const tbody: Schema = {
	render: "tbody",
};

export const tr: Schema = {
	render: "tr",
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		return new Tag("tr", node.attributes, await node.transformChildren(config));
	},
};

export const td: Schema = {
	render: "Td",
	attributes: {
		colspan: { default: 1 },
		rowspan: { default: 1 },
		align: { default: null },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		return new Tag(
			"td",
			{
				colSpan: node.attributes.colspan,
				rowSpan: node.attributes.rowspan,
				align: node.attributes.align,
			},
			await node.transformChildren(config),
		);
	},
};

export const col: Schema = {
	render: "col",
	attributes: {
		width: { default: null },
	},
};

export const colgroup: Schema = {
	render: "colgroup",
	selfClosing: false,
};
