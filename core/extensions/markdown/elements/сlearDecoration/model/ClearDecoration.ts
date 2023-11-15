import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		ClearDecoration: { clearDecoration: () => ReturnType };
	}
}

const ClearDecoration = Node.create({
	name: "ClearDecoration",

	addCommands() {
		return {
			clearDecoration:
				() =>
				({ editor }) => {
					for (let i = 0; i < 2; i++) editor.commands.setParagraph();
					return editor.commands.unsetAllMarks();
				},
		};
	},
});

export default ClearDecoration;
