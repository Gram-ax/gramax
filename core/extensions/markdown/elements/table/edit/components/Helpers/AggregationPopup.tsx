import Icon from "@components/Atoms/Icon";
import { SheetColumn } from "@core-ui/utils/Sheet";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import {
	getAggregatedValue,
	getFormattedValue,
	getFormatter,
} from "@ext/markdown/elements/table/edit/logic/aggregation";
import TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import { getFirstTdPosition } from "@ext/markdown/elements/table/edit/logic/utils";
import {
	AggregationMethod,
	aggregationMethodIcons,
	ColumnData,
	methodsWithTooltip,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import {
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useState } from "react";

interface AggregationPopupProps {
	editor: Editor;
	tableSheet: TableNodeSheet;
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

const AggregationPopup = ({ editor, tableSheet, node, cell, index, getPos }: AggregationPopupProps) => {
	const [aggregationData, setAggregationData] = useState<AggregationData>([]);

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

		const cells = isColumnHeader ? [] : tableSheet.getColumn(tableSheet.getLogicalColumnIndex(index));
		const formatter = getFormatter();
		const getCellsColumnData = (cells: SheetColumn<number>): ColumnData => {
			const data: ColumnData = [];

			for (let colIndex = 0; colIndex < cells.length; colIndex++) {
				const cell = cells[colIndex];
				if (!cell) continue;

				const node = editor.view.domAtPos(cell + 1);
				if (!node) continue;

				data.push(node.node.textContent?.trim() || "");
			}

			return data;
		};

		for (const name in AggregationMethod) {
			const data = getCellsColumnData(cells).slice(startRow);
			const aggregatedValue = getAggregatedValue(AggregationMethod[name], data);
			methodsData.push(getFormattedValue(formatter, aggregatedValue));
		}

		setAggregationData(methodsData);
	};

	const onOpenChange = (open: boolean) => {
		if (open) calcAggregation();
	};

	return (
		<DropdownMenuSub onOpenChange={onOpenChange}>
			<DropdownMenuSubTrigger>
				<Icon code="sigma" />
				{t("editor.table.aggregation.name")}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<DropdownMenuRadioGroup
					onValueChange={(value) => setAggregation(value as AggregationMethod)}
					value={cell?.attrs?.aggregation}
				>
					{Object.values(AggregationMethod).map((method, index) => (
						<DropdownMenuRadioItem key={method} value={method}>
							<Tooltip>
								{methodsWithTooltip[method] && (
									<TooltipContent>
										{t(`editor.table.aggregation.methods.${method}.tooltip`)}
									</TooltipContent>
								)}
								<TooltipTrigger asChild>
									<div className="flex items-center gap-2 w-full justify-between">
										<div className="flex items-center gap-2">
											<Icon code={aggregationMethodIcons[method]} />
											{t(`editor.table.aggregation.methods.${method}.name`)}
										</div>
										<span>{aggregationData[index]}</span>
									</div>
								</TooltipTrigger>
							</Tooltip>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				{cell.attrs?.aggregation && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => setAggregation(null)} type="danger">
							<Icon code="trash" />
							{t("delete")}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default AggregationPopup;
