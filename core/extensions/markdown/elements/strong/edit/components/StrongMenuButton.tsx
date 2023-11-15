import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const StrongMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleStrong().run()}
			icon={"bold"}
			tooltipText={"Жирный"}
			hotKey={"Mod-B"}
			nodeValues={{ mark: "strong" }}
		/>
	);
};

export default StrongMenuButton;
