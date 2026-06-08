import { Extension } from "@tiptap/core";

export const SCALABLE_NODES = ["image", "diagrams", "drawio", "mermaid", "plant-uml"];

export const ScaleExtension = Extension.create({
	name: "scale",

	addGlobalAttributes() {
		return [
			{
				types: SCALABLE_NODES,
				attributes: {
					scale: { default: null },
				},
			},
		];
	},
});
