import type { Schema } from "@ext/markdown/core/render/logic/Markdoc/src/types";

const mdModule: Schema = {
	render: "Module",
	attributes: {
		id: { type: String },
	},
};

export { mdModule as module };
