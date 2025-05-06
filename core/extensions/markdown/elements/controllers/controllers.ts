import { Extension } from "@tiptap/core";
import template from "./template";

interface ControllersProps {
	editable: boolean;
}

const Controllers = Extension.create<ControllersProps>({
	name: "controllers",

	addOptions() {
		return {
			editable: true,
		};
	},

	addProseMirrorPlugins() {
		return [template.bind(this)()];
	},
});

export default Controllers;
