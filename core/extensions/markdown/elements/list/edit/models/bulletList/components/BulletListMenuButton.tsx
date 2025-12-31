import t from "@ext/localization/locale/translate";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { Editor } from "@tiptap/core";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";

const BulletListMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "bulletList" });

	return (
		<ToolbarToggleButton
			tooltipText={t("editor.bullet-list")}
			hotKey={"Mod-Shift-8"}
			disabled={disabled}
			active={isActive}
			onClick={() => editor.chain().focus().toggleBulletList().run()}
		>
			<ToolbarIcon icon={"list"} />
		</ToolbarToggleButton>
	);
};

export default BulletListMenuButton;
