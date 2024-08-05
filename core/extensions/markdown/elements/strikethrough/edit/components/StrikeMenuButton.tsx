import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const StrikeMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleStrike().run()}
			icon={"strikethrough"}
			tooltipText={t("strike")}
			hotKey={"Mod-Shift-X"}
			nodeValues={{ mark: "s" }}
		/>
	);
};

export default StrikeMenuButton;
