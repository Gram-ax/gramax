import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { useCallback } from "react";

const TableMenuGroup = ({ editor, onClick }: { editor?: Editor; onClick?: () => void }) => {
	const canMergeCells = editor ? editor.can().mergeCells() : false;
	const canSplitCells = editor ? editor.can().splitCell() : false;

	const mergeCells = useCallback(() => {
		editor.chain().focus().mergeCells().run();
		onClick();
	}, [editor, onClick]);

	const splitCells = useCallback(() => {
		editor.chain().focus().splitCell().run();
		onClick();
	}, [editor, onClick]);

	const deleteRow = useCallback(() => {
		editor.chain().focus().deleteRow().run();
		onClick();
	}, [editor, onClick]);

	const deleteColumn = useCallback(() => {
		editor.chain().focus().deleteColumn().run();
		onClick();
	}, [editor, onClick]);

	return (
		<>
			{canMergeCells && (
				<ToolbarToggleButton
					className="text-inverse-primary-fg"
					disabled={!canMergeCells}
					onClick={mergeCells}
					tooltipText={t("editor.table.join-cells")}
				>
					<ToolbarIcon icon="merge-cells" />
				</ToolbarToggleButton>
			)}
			{canSplitCells && (
				<ToolbarToggleButton
					className="text-inverse-primary-fg"
					disabled={!canSplitCells}
					onClick={splitCells}
					tooltipText={t("editor.table.split-cells")}
				>
					<ToolbarIcon icon="split-cells" />
				</ToolbarToggleButton>
			)}
			<ToolbarToggleButton
				className="text-inverse-primary-fg"
				disabled={editor ? !editor.can().deleteRow() : false}
				onClick={deleteRow}
				tooltipText={t("editor.table.row.delete")}
			>
				<ToolbarIcon icon="delete-row" />
			</ToolbarToggleButton>
			<ToolbarToggleButton
				className="text-inverse-primary-fg"
				disabled={editor ? !editor.can().deleteColumn() : false}
				onClick={deleteColumn}
				tooltipText={t("editor.table.column.delete")}
			>
				<ToolbarIcon icon="delete-column" />
			</ToolbarToggleButton>
		</>
	);
};

export default TableMenuGroup;
