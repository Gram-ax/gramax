import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const EmMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ mark: "em" });

	return (
		<ToolbarToggleButton
			active={isActive}
			disabled={disabled}
			hotKey={"Mod-I"}
			onClick={() => editor.chain().focus().toggleItalic().run()}
			tooltipText={t("editor.italic")}
		>
			<ToolbarIcon icon={"italic"} />
		</ToolbarToggleButton>
	);
};

export default EmMenuButton;
