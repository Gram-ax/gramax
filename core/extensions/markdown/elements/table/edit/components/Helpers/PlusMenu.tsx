import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import AggregationPopup from "@ext/markdown/elements/table/edit/components/Helpers/AggregationPopup";
import {
	addRowDecoration,
	addColumnDecoration,
	getFirstTdPosition,
	getRowPosition,
} from "@ext/markdown/elements/table/edit/logic/utils";
import { AlignEnumTypes, TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { workHeaderType } from "@ext/markdown/elements/table/edit/logic/utils";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { memo, useMemo, useRef } from "react";
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

interface PlusMenuProps {
	isHovered: boolean;
	index: number;
	editor: Editor;
	getPos: () => number;
	node: Node;
	vertical?: boolean;
	className?: string;
	tableSheet?: TableNodeSheet;
}

export const TriggerParent = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
`;

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
	const { vertical, className, index, getPos, node, editor, tableSheet } = props;
	const cell = useMemo(() => {
		if (vertical) return;
		const position = getFirstTdPosition(node, index + 1, getPos());
		const newPosition = Math.min(Math.max(position, getPos()), editor.state.doc.content.size - 1);

		if (isNaN(newPosition)) return null;
		const child = editor.state.doc.resolve(newPosition);

		return child?.parent;
	}, [getPos, editor, node.firstChild.maybeChild(index), index]);

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
			.focus(getPos() + 1)
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
		if (vertical) position = getRowPosition(node, index + 1, getPos());
		else position = getFirstTdPosition(node, index + 1, getPos());

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
				asChild
				className={classNames(className, { vertical: vertical, horizontal: !vertical }, ["hidden"])}
			>
				<Icon code={vertical ? "ellipsis-vertical" : "ellipsis"} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{vertical ? (
					<>
						{index === 0 && (
							<>
								<TableHeaderCheckbox
									headerType={TableHeaderTypes.ROW}
									node={node}
									setHeader={setHeader}
									label={t("editor.table.row.title")}
								/>
								<DropdownMenuSeparator />
							</>
						)}
						<DropdownMenuItem
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
							type="danger"
							onSelect={rowDelete}
						>
							<Icon code="delete-row" />
							{t("editor.table.row.delete")}
						</DropdownMenuItem>
					</>
				) : (
					<>
						{index === 0 && (
							<TableHeaderCheckbox
								headerType={TableHeaderTypes.COLUMN}
								node={node}
								setHeader={setHeader}
								label={t("editor.table.column.title")}
							/>
						)}
						<AggregationPopup
							editor={editor}
							tableSheet={tableSheet}
							node={node}
							cell={cell}
							index={index}
							getPos={getPos}
						/>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<Icon code="align-justify" />
								{t("editor.table.align.name")}
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								<DropdownMenuRadioGroup
									value={cell?.attrs?.align || AlignEnumTypes.LEFT}
									onValueChange={(value) => setAlign(value as AlignEnumTypes)}
								>
									<DropdownMenuRadioItem value={AlignEnumTypes.LEFT}>
										<Icon code="align-left" />
										{t("editor.table.align.left")}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value={AlignEnumTypes.CENTER}>
										<Icon code="align-center" />
										{t("editor.table.align.center")}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value={AlignEnumTypes.RIGHT}>
										<Icon code="align-right" />
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
							<Icon code="delete-column" />
							{t("editor.table.column.delete")}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default styled(memo(PlusMenu))`
	display: flex;
	position: absolute;
	justify-content: center;
	align-items: center;
	border-radius: var(--radius-small);
	color: var(--color-line);
	cursor: pointer;
	border: 1px solid transparent;

	&:hover {
		opacity: 1;
		background-color: var(--color-table-plus-bg);
		color: var(--color-article-text);
		border: 1px solid var(--color-table-plus-border);
	}

	&.vertical {
		top: 50%;
		left: 0.55em;
		transform: translateY(-50%);
		height: 1.4em;
		width: 0.9em;
	}

	&.horizontal {
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		height: 0.9em;
		width: 1.4em;
	}

	> span {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
`;
