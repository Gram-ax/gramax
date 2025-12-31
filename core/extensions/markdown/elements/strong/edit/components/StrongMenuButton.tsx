import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const StrongMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ mark: "strong" });

	return (
		<ToolbarToggleButton
			tooltipText={t("editor.bold")}
			hotKey={"Mod-B"}
			disabled={disabled}
			active={isActive}
			onClick={() => editor.chain().focus().toggleStrong().run()}
		>
			<ToolbarIcon icon={"bold"} />
		</ToolbarToggleButton>
	);
};

export default StrongMenuButton;
