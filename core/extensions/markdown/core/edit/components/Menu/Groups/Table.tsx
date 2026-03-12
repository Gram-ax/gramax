import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { useCallback } from "react";

export interface TableMenuGroupButtons {
	mergeCells?: boolean;
	splitCells?: boolean;
	deleteRow?: boolean;
	deleteColumn?: boolean;
}

interface TableMenuGroupProps {
	editor?: Editor;
	onClick?: () => void;
	buttons?: TableMenuGroupButtons;
}

const TableMenuGroup = ({ editor, onClick, buttons }: TableMenuGroupProps) => {
	const { mergeCells = true, splitCells = true, deleteRow = true, deleteColumn = true } = buttons || {};
	const canMergeCells = editor && mergeCells && editor.can().mergeCells();
	const canSplitCells = editor && splitCells && editor.can().splitCell();
	const canDeleteRow = editor && deleteRow && editor.can().deleteRow();
	const canDeleteColumn = editor && deleteColumn && editor.can().deleteColumn();

	const onMergeCells = useCallback(() => {
		editor.chain().focus().mergeCells().run();
		onClick();
	}, [editor, onClick]);

	const onSplitCells = useCallback(() => {
		editor.chain().focus().splitCell().run();
		onClick();
	}, [editor, onClick]);

	const onDeleteRow = useCallback(() => {
		editor.chain().focus().deleteRow().run();
		onClick();
	}, [editor, onClick]);

	const onDeleteColumn = useCallback(() => {
		editor.chain().focus().deleteColumn().run();
		onClick();
	}, [editor, onClick]);

	return (
		<>
			{canMergeCells && (
				<ToolbarToggleButton
					className="text-inverse-primary-fg"
					onClick={onMergeCells}
					tooltipText={t("editor.table.join-cells")}
				>
					<ToolbarIcon icon="merge-cells" />
				</ToolbarToggleButton>
			)}
			{canSplitCells && (
				<ToolbarToggleButton
					className="text-inverse-primary-fg"
					onClick={onSplitCells}
					tooltipText={t("editor.table.split-cells")}
				>
					<ToolbarIcon icon="split-cells" />
				</ToolbarToggleButton>
			)}
			{canDeleteRow && (
				<ToolbarToggleButton
					className="text-inverse-primary-fg"
					onClick={onDeleteRow}
					tooltipText={t("editor.table.row.delete")}
				>
					<ToolbarIcon icon="delete-row" />
				</ToolbarToggleButton>
			)}
			{canDeleteColumn && (
				<ToolbarToggleButton
					className="text-inverse-primary-fg"
					onClick={onDeleteColumn}
					tooltipText={t("editor.table.column.delete")}
				>
					<ToolbarIcon icon="delete-column" />
				</ToolbarToggleButton>
			)}
		</>
	);
};

export default TableMenuGroup;
