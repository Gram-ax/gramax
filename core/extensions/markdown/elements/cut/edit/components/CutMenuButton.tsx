import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const CutMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleCut().run()}
			icon={"scissors"}
			tooltipText={"Блок скрытого текста"}
			nodeValues={{ action: "cut" }}
		/>
	);
};

export default CutMenuButton;
