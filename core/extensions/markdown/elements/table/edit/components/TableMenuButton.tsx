import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const TableMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			icon={"table-cells-large"}
			tooltipText={"Таблица"}
			onClick={() => {
				editor
					.chain()
					.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
					.focus(editor.state.selection.anchor + 2)
					.run();
			}}
			nodeValues={{ action: ["table"] }}
		/>
	);
};

export default TableMenuButton;
