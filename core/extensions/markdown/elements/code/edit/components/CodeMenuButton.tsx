import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import getIsSelected from "@ext/markdown/elementsUtils/getIsSelected";

const CodeMenuButton = ({ editor, isInline = false }: { editor: Editor; isInline?: boolean }) => {
	const isSelected = IsSelectedOneNodeService.value;

	const toggleCode = () => {
		if (isSelected) editor.chain().focus().toggleCode().run();
		else if (getIsSelected(editor.state)) editor.chain().focus().multilineCodeBlock().run();
		else editor.chain().focus().toggleCodeBlock().run();
	};

	return (
		<Button
			onClick={toggleCode}
			icon={"code-xml"}
			tooltipText={isSelected ? t("editor.code") : t("editor.code-block")}
			hotKey={isInline && "Mod-L"}
			nodeValues={isSelected ? { mark: "code" } : { action: "code_block" }}
		/>
	);
};

export default CodeMenuButton;
