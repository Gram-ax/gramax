import { Extension } from "@tiptap/core";
import { FLOAT_NODES } from "./consts";
import { FloatAlign } from "@ext/markdown/elements/float/edit/model/types";
import { NodeType } from "@tiptap/pm/model";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		float: {
			setFloat: (position: number, typeOrName: NodeType | string, value: FloatAlign) => ReturnType;
		};
	}
}

export const FloatExtension = Extension.create({
	name: "float",

	addGlobalAttributes() {
		return [
			{
				// We can't use "*" or "all" because TipTap doesn't support it. Need to add types manually.
				types: FLOAT_NODES,
				attributes: {
					float: {
						default: null,
						rendered: false,
						isRequired: false,
					},
				},
			},
		];
	},

	addCommands() {
		return {
			setFloat:
				(position: number, typeOrName: string, value: FloatAlign) =>
				({ chain }) => {
					return chain()
						.setNodeSelection(position)
						.updateAttributes(typeOrName, { float: value === "center" ? null : value })
						.run();
				},
		};
	},
});
