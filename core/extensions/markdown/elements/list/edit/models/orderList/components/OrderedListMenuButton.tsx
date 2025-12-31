import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const OrderedListMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "orderedList" });
	return (
		<ToolbarToggleButton
			onClick={() => editor.chain().focus().toggleOrderedList().run()}
			tooltipText={t("editor.ordered-list")}
			hotKey={"Mod-Shift-7"}
			disabled={disabled}
			active={isActive}
		>
			<ToolbarIcon icon={"list-ordered"} />
		</ToolbarToggleButton>
	);
};

export default OrderedListMenuButton;
