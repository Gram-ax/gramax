import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const StrikeMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ mark: "s" });
	return (
		<ToolbarToggleButton
			tooltipText={t("strike")}
			hotKey={"Mod-Shift-X"}
			onClick={() => editor.chain().focus().toggleStrike().run()}
			disabled={disabled}
			active={isActive}
		>
			<ToolbarIcon icon={"strikethrough"} />
		</ToolbarToggleButton>
	);
};

export default StrikeMenuButton;
