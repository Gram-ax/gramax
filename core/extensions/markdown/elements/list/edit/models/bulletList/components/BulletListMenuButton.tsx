import { setEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { DropdownMenuShortcut } from "@ui-kit/Dropdown";
import { ToolbarDropdownMenuItem, ToolbarIcon } from "@ui-kit/Toolbar";
import { useCallback } from "react";

const BulletListMenuButton = ({ editor, active, disabled }: { editor: Editor; active: boolean; disabled: boolean }) => {
	const onSelectBulletList = useCallback(() => {
		editor.chain().focus().toggleBulletList().run();
		setEditorStore({ lastUsedListType: "bullet" });
	}, [editor]);

	return (
		<ToolbarDropdownMenuItem
			active={active}
			data-testid="tb-bullet-list"
			disabled={disabled}
			onClick={onSelectBulletList}
		>
			<ToolbarIcon icon={"list"} />
			{t("editor.bullet-list")}
			<DropdownMenuShortcut value="Mod-Shift-8" />
		</ToolbarDropdownMenuItem>
	);
};

export default BulletListMenuButton;
