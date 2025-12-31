import t from "@ext/localization/locale/translate";
import { ToolbarToggleButton } from "@ui-kit/Toolbar";
import { Editor } from "@tiptap/core";
import { ToolbarIcon } from "@ui-kit/Toolbar";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";

const EmMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ mark: "em" });

	return (
		<ToolbarToggleButton
			tooltipText={t("editor.italic")}
			hotKey={"Mod-I"}
			onClick={() => editor.chain().focus().toggleItalic().run()}
			disabled={disabled}
			active={isActive}
		>
			<ToolbarIcon icon={"italic"} />
		</ToolbarToggleButton>
	);
};

export default EmMenuButton;
