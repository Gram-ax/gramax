import ButtonsLayout from "@components/Layouts/ButtonLayout";
import TaskListMenuButton from "@ext/markdown/elements/list/edit/models/taskList/components/TaskListMenuButton";
import { Editor } from "@tiptap/core";
import OrderedListMenuButton from "@ext/markdown/elements/list/edit/models/orderList/components/OrderedListMenuButton";
import BulletListMenuButton from "@ext/markdown/elements/list/edit/models/bulletList/components/BulletListMenuButton";

const ListMenuGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<ButtonsLayout>
			<BulletListMenuButton editor={editor} />
			<OrderedListMenuButton editor={editor} />
			<TaskListMenuButton editor={editor} />
		</ButtonsLayout>
	);
};

export default ListMenuGroup;
