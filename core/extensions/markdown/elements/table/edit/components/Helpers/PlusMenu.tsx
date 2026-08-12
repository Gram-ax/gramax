// import Icon from "@components/Atoms/Icon";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import AggregationPopup from "@ext/markdown/elements/table/edit/components/Helpers/AggregationPopup";
import type TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import {
	addColumnDecoration,
	addRowDecoration,
	getFirstTdPosition,
	getRowPosition,
	workHeaderType,
} from "@ext/markdown/elements/table/edit/logic/utils";
import { AlignEnumTypes, TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { type HTMLAttributes, memo, useMemo, useRef } from "react";

interface PlusMenuProps {
	index: number;
	editor: Editor;
	pos: number;
	node: Node;
	vertical?: boolean;
	className?: string;
	tableSheet?: TableNodeSheet;
	dataQa?: string;
}

export const TriggerParent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex w-full items-center justify-between", className)} {...props} />
);

interface TableHeaderCheckboxProps {
	headerType: TableHeaderTypes.ROW | TableHeaderTypes.COLUMN;
	node: Node;
	setHeader: (header: TableHeaderTypes) => void;
	label: string;
}

const TableHeaderCheckbox = ({ headerType, node, setHeader, label }: TableHeaderCheckboxProps) => {
	const { checked, newHeader } = workHeaderType(node.attrs.header, headerType);
	return (
		<DropdownMenuCheckboxItem checked={checked} onSelect={() => setHeader(newHeader)}>
			{label}
		</DropdownMenuCheckboxItem>
	);
};

const PlusMenu = (props: PlusMenuProps) => {
	const openRef = useRef(false);
	const { vertical, className, index, pos, node, editor, tableSheet, dataQa } = props;

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const cell = useMemo(() => {
		if (vertical) return;
		const position = getFirstTdPosition(node, index + 1, pos);
		const newPosition = Math.min(Math.max(position, pos), editor.state.doc.content.size - 1);

		if (Number.isNaN(newPosition)) return null;
		const child = editor.state.doc.resolve(newPosition);

		return child?.parent;
	}, [pos, editor, node.firstChild.maybeChild(index), index, vertical]);

	const setAlign = (align: AlignEnumTypes) => {
		editor
			.chain()
			.command(({ tr }) => {
				const positions = tableSheet.getColumn(tableSheet.getLogicalColumnIndex(index));
				if (!positions) return false;

				positions.forEach((pos) => {
					tr.setNodeAttribute(pos, "align", align);
				});

				return true;
			})
			.setMeta("removeDecoration", true)
			.run();
	};

	const setHeader = (header: TableHeaderTypes) => {
		editor
			.chain()
			.focus(pos + 1)
			.updateAttributes("table", { header })
			.run();
	};

	const rowDelete = () => {
		const position = tableSheet.getCell(index, 0);
		if (!position) return;
		editor.chain().focus(position).deleteRow().setMeta("removeDecoration", true).run();
	};

	const columnDelete = () => {
		const logicalColumnIndex = tableSheet.getLogicalColumnIndex(index);
		const position = tableSheet.getCell(0, logicalColumnIndex);
		if (!position) return;
		editor.chain().focus(position).deleteColumn().setMeta("removeDecoration", true).run();
	};

	const onOpen = () => {
		if (!tableSheet) return;

		let tr = editor.state.tr;
		if (vertical) {
			tr = addRowDecoration(tableSheet, index, tr, {
				class: "selectedCell",
			});
		} else {
			tr = addColumnDecoration(tableSheet, index, tr, {
				class: "selectedCell",
			});
		}

		if (tr) editor.view.dispatch(tr);
	};

	const onMouseEnter = () => {
		if (!tableSheet) return;

		let tr = editor.state.tr;
		tr.setMeta("removeDecoration", true);

		if (vertical) {
			tr = addRowDecoration(tableSheet, index, tr, {
				class: "delete",
			});
		} else {
			tr = addColumnDecoration(tableSheet, index, tr, {
				class: "delete",
			});
		}

		if (tr) editor.view.dispatch(tr);
	};

	const onMouseLeave = () => {
		if (!tableSheet || !openRef.current) return;
		let tr = editor.state.tr.setMeta("removeDecoration", true);

		if (vertical) {
			tr = addRowDecoration(tableSheet, index, tr, {
				class: "selectedCell",
			});
		} else {
			tr = addColumnDecoration(tableSheet, index, tr, {
				class: "selectedCell",
			});
		}

		if (tr) editor.view.dispatch(tr);
	};

	const onClose = () => {
		let position = null;
		if (vertical) position = getRowPosition(node, index + 1, pos);
		else position = getFirstTdPosition(node, index + 1, pos);

		if (!position) return;
		editor.chain().focus(position).setMeta("removeDecoration", true).run();
	};

	const onOpenChange = (open: boolean) => {
		openRef.current = open;
		if (open) onOpen();
		else onClose();
	};

	return (
		<DropdownMenu onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				className={cn(
					"absolute cursor-pointer items-center justify-center rounded-[var(--radius-small)] border border-transparent text-[var(--color-line)]",
					"hover:border-[var(--color-table-plus-border)] hover:bg-[var(--color-table-plus-bg)] hover:text-[var(--color-article-text)] hover:opacity-100",
					"[&>span]:flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:justify-center",
					className,
					"!hidden",
					`[&[aria-expanded="true"]]:!flex`,
					vertical
						? "left-[0.55em] top-1/2 h-[1.4em] w-[0.9em] -translate-y-1/2"
						: "left-1/2 top-0 h-[0.9em] w-[1.4em] -translate-x-1/2",
				)}
				data-table-plus-menu={vertical ? "row" : "column"}
				data-testid={dataQa}
			>
				<Icon icon={vertical ? "ellipsis-vertical" : "ellipsis"} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{vertical ? (
					<>
						{index === 0 && (
							<>
								<TableHeaderCheckbox
									headerType={TableHeaderTypes.ROW}
									label={t("editor.table.row.title")}
									node={node}
									setHeader={setHeader}
								/>
								<DropdownMenuSeparator />
							</>
						)}
						<DropdownMenuItem
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
							onSelect={rowDelete}
							type="danger"
						>
							<Icon icon="delete-row" />
							{t("editor.table.row.delete")}
						</DropdownMenuItem>
					</>
				) : (
					<>
						{index === 0 && (
							<TableHeaderCheckbox
								headerType={TableHeaderTypes.COLUMN}
								label={t("editor.table.column.title")}
								node={node}
								setHeader={setHeader}
							/>
						)}
						<AggregationPopup
							cell={cell}
							editor={editor}
							index={index}
							node={node}
							pos={pos}
							tableSheet={tableSheet}
						/>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<Icon icon="align-justify" />
								{t("editor.table.align.name")}
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								<DropdownMenuRadioGroup
									onValueChange={(value) => setAlign(value as AlignEnumTypes)}
									value={cell?.attrs?.align || AlignEnumTypes.LEFT}
								>
									<DropdownMenuRadioItem value={AlignEnumTypes.LEFT}>
										<Icon icon="align-left" />
										{t("editor.table.align.left")}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value={AlignEnumTypes.CENTER}>
										<Icon icon="align-center" />
										{t("editor.table.align.center")}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value={AlignEnumTypes.RIGHT}>
										<Icon icon="align-right" />
										{t("editor.table.align.right")}
									</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
							onSelect={columnDelete}
							type="danger"
						>
							<Icon icon="delete-column" />
							{t("editor.table.column.delete")}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default memo(PlusMenu);
