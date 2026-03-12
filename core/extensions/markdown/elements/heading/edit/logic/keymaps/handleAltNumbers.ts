import type { Editor } from "@tiptap/core";
import type { Level } from "../../model/heading";

export const handleAltNumbers = (editor: Editor, levels: Level[]) =>
	levels
		.filter((level) => level < 5)
		.reduce((items, level) => {
			items[`Mod-Alt-${level}`] = () => {
				if (editor.state.selection.$from.parent === editor.state.doc.firstChild) return false;
				return editor.commands.toggleHeading({ level });
			};
			return items;
		}, {});
