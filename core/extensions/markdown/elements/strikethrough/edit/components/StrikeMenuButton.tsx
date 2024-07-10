import useLocalize from "@ext/localization/useLocalize";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const StrikeMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleStrike().run()}
			icon={"strikethrough"}
			tooltipText={useLocalize("strike")}
			hotKey={"Mod-Shift-X"}
			nodeValues={{ mark: "s" }}
		/>
	);
};

export default StrikeMenuButton;
