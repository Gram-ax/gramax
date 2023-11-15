import { Schema, Tag } from "../../core/render/logic/Markdoc";

export const sub: Schema = {
	render: "Sub",
	attributes: {},
	transform: ((node) => {
		return new Tag("Sub", {}, [node.children[0].attributes.content]);
	}) as any,
};
