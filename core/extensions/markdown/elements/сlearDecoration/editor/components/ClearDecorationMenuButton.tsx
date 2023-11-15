import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const ClearDecorationMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().clearDecoration().run()}
			icon={"text-slash"}
			tooltipText={"Очистить оформление"}
		/>
	);
};

export default ClearDecorationMenuButton;
