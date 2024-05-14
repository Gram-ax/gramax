import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const NoteMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleNote().run()}
			icon={"sticky-note"}
			iconStyle={{transform:"scale(1, -1)"}}
			tooltipText={"Заметка"}
			nodeValues={{ action: "note" }}
		/>
	);
};

export default NoteMenuButton;
