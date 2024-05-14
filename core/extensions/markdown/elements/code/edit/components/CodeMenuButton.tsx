import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const CodeMenuButton = ({ editor }: { editor: Editor }) => {
	const isSelected = IsSelectedOneNodeService.value;
	return (
		<Button
			onClick={() => editor.chain().focus().toggleCode().run()}
			icon={"code-xml"}
			tooltipText={isSelected ? "Строка кода" : "Блок кода"}
			hotKey={"Mod-Shift-L"}
			nodeValues={isSelected ? { mark: "code" } : { action: "code_block" }}
		/>
	);
};

export default CodeMenuButton;
