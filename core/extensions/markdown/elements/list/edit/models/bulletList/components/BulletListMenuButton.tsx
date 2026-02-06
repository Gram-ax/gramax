import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const BulletListMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "bulletList" });

	return (
		<ToolbarToggleButton
			active={isActive}
			disabled={disabled}
			hotKey={"Mod-Shift-8"}
			onClick={() => editor.chain().focus().toggleBulletList().run()}
			tooltipText={t("editor.bullet-list")}
		>
			<ToolbarIcon icon={"list"} />
		</ToolbarToggleButton>
	);
};

export default BulletListMenuButton;
