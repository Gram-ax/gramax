import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const HTMLMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().setHTML({ content: "<p>HTML</p>" }).run()}
			icon={"file-code"}
			tooltipText={"HTML"}
			nodeValues={{ action: "html" }}
		/>
	);
};

export default HTMLMenuButton;
