import TaskItem from "@tiptap/extension-task-item";

const CustomTaskItem = TaskItem.configure({
	nested: true,
});

export default CustomTaskItem;
