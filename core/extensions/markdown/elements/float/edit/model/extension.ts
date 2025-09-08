import { Extension } from "@tiptap/core";
import { FLOAT_NODES } from "./consts";
import { FloatAlign } from "@ext/markdown/elements/float/edit/model/types";
import { NodeType } from "@tiptap/pm/model";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		float: {
			setFloat: (typeOrName: NodeType | string, value: FloatAlign) => ReturnType;
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
				(typeOrName: string, value: FloatAlign) =>
				({ commands }) => {
					if (value === "center") return commands.updateAttributes(typeOrName, { float: null });
					return commands.updateAttributes(typeOrName, { float: value });
				},
		};
	},
});
