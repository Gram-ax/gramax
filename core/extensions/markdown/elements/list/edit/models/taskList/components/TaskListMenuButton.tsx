import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const TaskListMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().toggleTaskList().run()}
			icon={"list-todo"}
			tooltipText={t("editor.task-list")}
			hotKey={"Mod-Shift-9"}
			nodeValues={{ action: "task_list" }}
		/>
	);
};

export default TaskListMenuButton;
