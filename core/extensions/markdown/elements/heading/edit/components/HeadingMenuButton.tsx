import t from "@ext/localization/locale/translate";
import { Level } from "@ext/markdown/elements/heading/edit/model/heading";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleItem } from "@ui-kit/Toolbar";

interface HeadingMenuButtonProps {
	level: Level;
	editor: Editor;
}

const HeadingMenuButton = ({ level, editor }: HeadingMenuButtonProps) => {
	return (
		<ToolbarToggleItem
			tooltipText={`${t("editor.heading")} ${level}`}
			active={editor.isActive("heading", { level })}
			hotKey={`Mod-Alt-${level}`}
			value={level.toString()}
			onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
		>
			<ToolbarIcon icon={`heading-${level}-custom`} />
		</ToolbarToggleItem>
	);
};

export default HeadingMenuButton;
