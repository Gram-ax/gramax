import TaskItem from "@tiptap/extension-task-item";

const customTaskItem = TaskItem.configure({
	nested: true,
});

export default customTaskItem;
