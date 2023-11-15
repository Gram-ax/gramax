import { Extension } from "@tiptap/core";

interface attributeUpdaterOptions {
	types: string[];
	attributes: string;
}

const attributeUpdater = Extension.create<attributeUpdaterOptions>({
	name: "attribute_updater",
	priority: 1001,

	addOptions() {
		return {
			types: null,
			attributes: null,
		};
	},

	addGlobalAttributes() {
		const attributes = JSON.parse(this.options.attributes);
		return [
			{
				types: this.options.types,
				attributes,
			},
		];
	},
});

export default attributeUpdater;
