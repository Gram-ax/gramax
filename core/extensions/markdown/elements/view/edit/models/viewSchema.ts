import { Display } from "@ext/properties/models/displays";

const viewSchema = {
	group: "block",
	draggable: true,
	disableDropCursor: true,
	attrs: {
		defs: { default: [] },
		orderby: { default: [] },
		groupby: { default: [] },
		select: { default: [] },
		display: { default: Display.List },
	},
};

export default viewSchema;
