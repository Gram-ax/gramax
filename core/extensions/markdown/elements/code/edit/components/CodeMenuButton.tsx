import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const CodeMenuButton = ({ editor }: { editor: Editor }) => {
	const isSelected = IsSelectedOneNodeService.value;
	return (
		<Button
			onClick={() => editor.chain().focus().toggleCode().run()}
			icon={"code-xml"}
			tooltipText={isSelected ? t("editor.code") : t("editor.code-block")}
			hotKey={"Mod-Shift-L"}
			nodeValues={isSelected ? { mark: "code" } : { action: "code_block" }}
		/>
	);
};

export default CodeMenuButton;
