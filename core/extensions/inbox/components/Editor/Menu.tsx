import Toolbar from "@ext/markdown/core/edit/components/Menu/Menu";
import { Editor } from "@tiptap/react";

const Menu = ({ id, menu, editor }: { id: string; menu: (editor: Editor) => JSX.Element; editor: Editor }) => {
	if (!menu) return null;

	return (
		<Toolbar editor={editor} id={id}>
			{menu(editor)}
		</Toolbar>
	);
};

export default Menu;
