import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import { Editor } from "@tiptap/core";
import Table from "./TableButtons";

const TableMenu = ({ editor }: { editor?: Editor }) => {
	if (editor && !editor.isActive("table")) return null;
	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Table editor={editor} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};
export default TableMenu;
