import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const TableMenuGroup = ({ editor, onClick }: { editor?: Editor; onClick?: () => void }) => {
	const canMergeCells = editor ? editor.can().mergeCells() : false;
	const canSplitCells = editor ? editor.can().splitCell() : false;
	const mergeCells = () => {
		editor.chain().focus().mergeCells().run();
		onClick();
	};

	const splitCells = () => {
		editor.chain().focus().splitCell().run();
		onClick();
	};

	return (
		<>
			{canMergeCells && (
				<Button
					onClick={mergeCells}
					icon="merge-cells"
					useSvgDefaultWidth={false}
					tooltipText={t("editor.table.join-cells")}
				/>
			)}
			{canSplitCells && (
				<Button
					onClick={splitCells}
					disabled={!canSplitCells}
					icon="split-cells"
					useSvgDefaultWidth={false}
					tooltipText={t("editor.table.split-cells")}
				/>
			)}
			<Button
				onClick={() => editor.chain().focus().deleteRow().run()}
				disabled={editor ? !editor.can().deleteRow() : false}
				icon="delete-row"
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.row.delete")}
			/>
			<Button
				onClick={() => editor.chain().focus().deleteColumn().run()}
				disabled={editor ? !editor.can().deleteColumn() : false}
				icon="delete-column"
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.column.delete")}
			/>
		</>
	);
};

export default TableMenuGroup;
