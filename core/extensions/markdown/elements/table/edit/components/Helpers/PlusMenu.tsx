import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
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
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { memo, useMemo, useRef } from "react";

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

export const PopoverItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;

	i:has(.lucide.lucide-check) {
		margin-left: 0.5em;
	}
`;

export const TriggerParent = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
`;

const PlusMenu = (props: PlusMenuProps) => {
	const { vertical, className, index, getPos, node, editor, tableSheet } = props;
	const submenuRef = useRef<HTMLDivElement>(null);
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
		editor.chain().focus(getPos()).updateAttributes("table", { header: header }).run();
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
		if (!tableSheet) return;
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

	return (
		<PopupMenuLayout
			buttonClassName={classNames(className, { vertical: vertical, horizontal: !vertical }, ["hidden"])}
			offset={[10, 0]}
			appendTo={() => document.body}
			openTrigger="click"
			onOpen={onOpen}
			onClose={onClose}
			trigger={<Icon code={vertical ? "ellipsis-vertical" : "ellipsis"} />}
		>
			{vertical ? (
				<>
					{index === 0 && (
						<PopoverItem onClick={() => setHeader(TableHeaderTypes.ROW)}>
							<ButtonLink text={t("editor.table.row.title")} iconCode="row-title" />
							{node.attrs.header === TableHeaderTypes.ROW && <Icon code="check" />}
						</PopoverItem>
					)}
					<ButtonLink
						onMouseEnter={onMouseEnter}
						onMouseLeave={onMouseLeave}
						text={t("editor.table.row.delete")}
						onClick={rowDelete}
						iconCode="delete-row"
					/>
				</>
			) : (
				<>
					{index === 0 && (
						<PopoverItem onClick={() => setHeader(TableHeaderTypes.COLUMN)}>
							<ButtonLink text={t("editor.table.column.title")} iconCode="column-title" />
							{node.attrs.header === TableHeaderTypes.COLUMN && <Icon code="check" />}
						</PopoverItem>
					)}
					<AggregationPopup
						editor={editor}
						tableSheet={tableSheet}
						node={node}
						cell={cell}
						index={index}
						getPos={getPos}
					/>
					<PopupMenuLayout
						openTrigger="focus mouseenter"
						placement="right-start"
						offset={[10, -5]}
						appendTo={() => submenuRef.current}
						trigger={
							<TriggerParent ref={submenuRef}>
								<ButtonLink text={t("editor.table.align.name")} iconCode="align-justify" />
								<Icon code="chevron-right" />
							</TriggerParent>
						}
					>
						<PopoverItem onClick={() => setAlign(AlignEnumTypes.LEFT)}>
							<ButtonLink text={t("editor.table.align.left")} iconCode="align-left" />
							{(cell?.attrs?.align === AlignEnumTypes.LEFT || !cell?.attrs?.align) && (
								<Icon code="check" />
							)}
						</PopoverItem>
						<PopoverItem onClick={() => setAlign(AlignEnumTypes.CENTER)}>
							<ButtonLink text={t("editor.table.align.center")} iconCode="align-center" />
							{cell?.attrs?.align === AlignEnumTypes.CENTER && <Icon code="check" />}
						</PopoverItem>
						<PopoverItem onClick={() => setAlign(AlignEnumTypes.RIGHT)}>
							<ButtonLink text={t("editor.table.align.right")} iconCode="align-right" />
							{cell?.attrs?.align === AlignEnumTypes.RIGHT && <Icon code="check" />}
						</PopoverItem>
					</PopupMenuLayout>
					<ButtonLink
						onMouseEnter={onMouseEnter}
						onMouseLeave={onMouseLeave}
						text={t("editor.table.column.delete")}
						onClick={columnDelete}
						iconCode="delete-column"
					/>
				</>
			)}
		</PopupMenuLayout>
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
