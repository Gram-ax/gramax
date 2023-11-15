import { Extension } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "prosemirror-state";

const OnDeleteMark = Extension.create({
	name: "OnDeleteMark",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("OnDeleteMark"),
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

						const removeMarks: Mark[] = [];
						for (const oldMark of oldMarks) {
							const found = newMarks.find((newMark) => newMark.eq(oldMark));
							if (!found) removeMarks.push(oldMark);
						}
						if (this.options.onDeleteMarks) this.options.onDeleteMarks(removeMarks);
					}
					return null;
				},
			}),
		];
	},
});

export default OnDeleteMark;
