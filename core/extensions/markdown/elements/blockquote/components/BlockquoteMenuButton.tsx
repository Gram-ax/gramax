import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const BlockquoteMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleBlockquote().run()}
			icon={"text-quote"}
			nodeValues={{ action: "blockquote" }}
			tooltipText={"Цитата"}
		/>
	);
};

export default BlockquoteMenuButton;
