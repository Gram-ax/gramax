import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { PopoverItem, TriggerParent } from "@ext/markdown/elements/table/edit/components/Helpers/PlusMenu";
import {
	getAggregatedValue,
	getCellsColumnData,
	getCellsInColumn,
	getFormattedValue,
	getFormatter,
} from "@ext/markdown/elements/table/edit/logic/aggregation";
import { getFirstTdPosition } from "@ext/markdown/elements/table/edit/logic/utils";
import {
	AggregationMethod,
	aggregationMethodIcons,
	methodsWithTooltip,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { useRef, useState } from "react";

interface AggregationPopupProps {
	editor: Editor;
	node: Node;
	cell: Node;
	index: number;
	getPos: () => number;
}

export const AggregationItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 2em;
`;

type AggregationData = string[];

const AggregationPopup = ({ editor, node, cell, index, getPos }: AggregationPopupProps) => {
	const [aggregationData, setAggregationData] = useState<AggregationData>([]);
	const submenuRef = useRef<HTMLDivElement>(null);

	const setAggregation = (method: AggregationMethod) => {
		const position = getFirstTdPosition(node, index + 1, getPos());
		editor.chain().focus(position).setCellAttribute("aggregation", method).run();
	};

	const calcAggregation = () => {
		const data = editor.view.domAtPos(getPos() + 1);
		const domNode = data?.node as HTMLElement;
		if (!domNode) return;

		const table = domNode.parentElement as HTMLTableElement;
		const methodsData = [];

		const isRowHeader = table.dataset.header === "row";
		const isColumnHeader = table.dataset.header === "column";
		const startRow = isRowHeader ? 1 : 0;

		const cells = isColumnHeader ? [] : getCellsInColumn(table, index);
		const formatter = getFormatter();
		const lastRow = table.lastElementChild.lastElementChild as HTMLTableRowElement;
		const lastRowIsAggregated = lastRow.dataset.aggregation === "true";

		for (const name in AggregationMethod) {
			const data = getCellsColumnData(cells).slice(startRow, lastRowIsAggregated ? -1 : undefined);
			const aggregatedValue = getAggregatedValue(AggregationMethod[name], data);
			methodsData.push(getFormattedValue(formatter, aggregatedValue));
		}

		setAggregationData(methodsData);
	};

	return (
		<PopupMenuLayout
			openTrigger="focus mouseenter"
			placement="right-start"
			onOpen={calcAggregation}
			appendTo={() => submenuRef.current}
			offset={[10, -5]}
			trigger={
				<TriggerParent ref={submenuRef}>
					<ButtonLink text={t("editor.table.aggregation.name")} iconCode="sigma" />
					<Icon code="chevron-right" />
				</TriggerParent>
			}
		>
			<>
				{Object.values(AggregationMethod).map((method, index) => (
					<Tooltip
						key={method}
						delay={[1000, 0]}
						content={methodsWithTooltip[method] && t(`editor.table.aggregation.methods.${method}.tooltip`)}
					>
						<AggregationItem onClick={() => setAggregation(method)}>
							<ButtonLink
								text={t(`editor.table.aggregation.methods.${method}.name`)}
								iconCode={aggregationMethodIcons[method]}
							/>
							<span>
								{aggregationData[index]}
								{cell?.attrs?.aggregation === method ? (
									<Icon code="check" style={{ marginLeft: "8px" }} />
								) : (
									<span style={{ marginLeft: "23px" }}></span>
								)}
							</span>
						</AggregationItem>
					</Tooltip>
				))}
				{cell?.attrs?.aggregation && (
					<>
						<div className="divider" />
						<PopoverItem onClick={() => setAggregation(null)}>
							<ButtonLink text={t("delete")} iconCode="trash" />
						</PopoverItem>
					</>
				)}
			</>
		</PopupMenuLayout>
	);
};

export default AggregationPopup;
