import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const TaskListMenuButton = ({ editor }: { editor: Editor }) => {
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "taskList" });
	return (
		<ToolbarToggleButton
			onClick={() => editor.chain().focus().toggleTaskList().run()}
			tooltipText={t("editor.task-list")}
			hotKey={"Mod-Shift-9"}
			disabled={disabled}
			active={isActive}
		>
			<ToolbarIcon icon={"list-todo"} />
		</ToolbarToggleButton>
	);
};

export default TaskListMenuButton;
