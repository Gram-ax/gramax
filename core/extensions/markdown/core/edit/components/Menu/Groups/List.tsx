import { cssMedia } from "@core-ui/utils/cssUtils";
import BulletListMenuButton from "@ext/markdown/elements/list/edit/models/bulletList/components/BulletListMenuButton";
import OrderedListMenuButton from "@ext/markdown/elements/list/edit/models/orderList/components/OrderedListMenuButton";
import TaskListMenuButton from "@ext/markdown/elements/list/edit/models/taskList/components/TaskListMenuButton";
import { useMediaQuery } from "@mui/material";
import type { Editor } from "@tiptap/core";
import { ToolbarSeparator } from "@ui-kit/Toolbar";

export interface ListMenuGroupButtons {
	bulletList?: boolean;
	orderedList?: boolean;
	taskList?: boolean;
}

interface ListMenuGroupProps {
	editor?: Editor;
	buttons?: ListMenuGroupButtons;
}

const ListMenuGroup = ({ editor, buttons }: ListMenuGroupProps) => {
	const { bulletList = true, orderedList = true, taskList = true } = buttons || {};
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	return (
		<>
			{(bulletList || orderedList || taskList || isMobile) && <ToolbarSeparator />}
			{bulletList && <BulletListMenuButton editor={editor} />}
			{orderedList && <OrderedListMenuButton editor={editor} />}
			{taskList && <TaskListMenuButton editor={editor} />}
		</>
	);
};

export default ListMenuGroup;
