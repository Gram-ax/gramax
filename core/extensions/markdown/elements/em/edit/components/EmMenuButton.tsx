import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const EmMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleItalic().run()}
			icon={"italic"}
			tooltipText={t("editor.italic")}
			hotKey={"Mod-I"}
			nodeValues={{ mark: "em" }}
		/>
	);
};

export default EmMenuButton;
