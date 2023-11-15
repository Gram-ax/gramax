import { Extension } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "prosemirror-state";

const OnAddMark = Extension.create({
	name: "OnAddMark",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("OnAddMark"),
				appendTransaction: (transactions, oldState, newState) => {
					if (transactions.some((tr) => tr.docChanged)) {
						let oldMarks = [],
							newMarks = [];

						oldState.doc.descendants((node) => {
							if (node.isText) oldMarks = oldMarks.concat(node.marks);
						});

						newState.doc.descendants((node) => {
							if (node.isText) newMarks = newMarks.concat(node.marks);
						});

						const addedMarks: Mark[] = [];
						for (const newMark of newMarks) {
							const found = oldMarks.find((oldMark) => oldMark.eq(newMark));
							if (!found) addedMarks.push(newMark);
						}

						if (this.options.onAddMarks) this.options.onAddMarks(addedMarks);
					}
					return null;
				},
			}),
		];
	},
});

export default OnAddMark;
