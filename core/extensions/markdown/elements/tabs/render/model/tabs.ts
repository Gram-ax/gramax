import { CustomAttributeType, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";

export const tabs: Schema = {
	render: "Tabs",
	attributes: {
		childAttrs: {
			type: {} as CustomAttributeType,
		},
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		const children = (await node.transformChildren(config)).filter((c) => c);
		if (!children || children.length == 0) return null;
		if (children.length == 1) return children;
		return new Tag(
			"Tabs",
			{
				childAttrs: children.map((t, idx) => {
					(t as Tag).attributes.idx = idx;
					return (t as Tag).attributes;
				}),
			},
			children,
		);
	},
};

export const tab: Schema = {
	render: "Tab",
	attributes: {
		name: { type: String },
		icon: { type: String },
		tag: { type: String },
	},
	selfClosing: false,
	type: SchemaType.block,
	transform: async (node, config) => {
		return new Tag("Tab", node.attributes, await node.transformChildren(config));
	},
};
