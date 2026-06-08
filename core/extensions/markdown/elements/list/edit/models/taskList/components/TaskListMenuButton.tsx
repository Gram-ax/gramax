import { setEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { DropdownMenuShortcut } from "@ui-kit/Dropdown";
import { ToolbarDropdownMenuItem, ToolbarIcon } from "@ui-kit/Toolbar";
import { useCallback } from "react";

const TaskListMenuButton = ({ editor, active, disabled }: { editor: Editor; active: boolean; disabled: boolean }) => {
	const onSelectTaskList = useCallback(() => {
		editor.chain().focus().toggleTaskList().run();
		setEditorStore({ lastUsedListType: "task" });
	}, [editor]);

	return (
		<ToolbarDropdownMenuItem
			active={active}
			data-testid="tb-task-list"
			disabled={disabled}
			onClick={onSelectTaskList}
		>
			<ToolbarIcon icon={"list-todo"} />
			{t("editor.task-list")}
			<DropdownMenuShortcut value="Mod-Shift-9" />
		</ToolbarDropdownMenuItem>
	);
};

export default TaskListMenuButton;
