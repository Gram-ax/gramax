import { setEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { DropdownMenuShortcut } from "@ui-kit/Dropdown";
import { ToolbarDropdownMenuItem, ToolbarIcon } from "@ui-kit/Toolbar";
import { useCallback } from "react";

interface OrderedListMenuButtonProps {
	editor: Editor;
	active: boolean;
	disabled: boolean;
}

const OrderedListMenuButton = ({ editor, active, disabled }: OrderedListMenuButtonProps) => {
	const onSelectOrderedList = useCallback(() => {
		editor.chain().focus().toggleOrderedList().run();
		setEditorStore({ lastUsedListType: "ordered" });
	}, [editor]);

	return (
		<ToolbarDropdownMenuItem
			active={active}
			data-testid="tb-ordered-list"
			disabled={disabled}
			onClick={onSelectOrderedList}
		>
			<ToolbarIcon icon={"list-ordered"} />
			{t("editor.ordered-list")}
			<DropdownMenuShortcut value="Mod-Shift-7" />
		</ToolbarDropdownMenuItem>
	);
};

export default OrderedListMenuButton;
