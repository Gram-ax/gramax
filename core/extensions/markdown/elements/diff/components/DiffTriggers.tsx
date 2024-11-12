import Button from "@components/Atoms/Button/Button";
import showDiffs from "@ext/markdown/elements/diff/logic/showDiffs";
import { Editor } from "@tiptap/react";

const DiffTriggers = ({ editor, oldContentEditor }: { editor: Editor; oldContentEditor: Editor }) => {
	if (!editor || !oldContentEditor) return null;

	return (
		<div style={{ display: "flex", gap: "5px" }}>
			<Button
				onClick={() => {
					oldContentEditor.commands.setContent(editor.state.doc.toJSON());
				}}
			>
				bind prev state
			</Button>
			<Button
				onClick={() => {
					console.log("old\n", oldContentEditor);
					console.log("new\n", editor);
					showDiffs(oldContentEditor, editor);
				}}
			>
				get diff
			</Button>
		</div>
	);
};

export default DiffTriggers;
