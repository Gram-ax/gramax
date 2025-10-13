import { Editor } from "@tiptap/core";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import Icon from "@components/Atoms/Icon";
import {
	AggregationMethod,
	aggregationMethodIcons,
	methodsWithTooltip,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import { useState } from "react";
import {
	getAggregatedValue,
	getFormattedValue,
	getFormatter,
} from "@ext/markdown/elements/table/edit/logic/aggregation";
import t from "@ext/localization/locale/translate";
import { CellSelection } from "prosemirror-tables";
import { showPopover } from "@core-ui/showPopover";
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

type AggregationData = string[];

const TableAggregation = ({ editor, disabled }: { editor: Editor; disabled: boolean }) => {
	const [aggregationData, setAggregationData] = useState<AggregationData>([]);

	const calcAggregation = () => {
		if (!(editor.state.selection instanceof CellSelection)) return;

		const cellsData = editor.state.selection.ranges
			.map((range) => {
				return range.$from.parent.textContent?.trim() || "";
			})
			.filter((d) => d && d.length);

		const methodsData = [];
		const formatter = getFormatter();
		for (const name in AggregationMethod) {
			const aggregatedValue = getAggregatedValue(AggregationMethod[name], cellsData);
			methodsData.push(getFormattedValue(formatter, aggregatedValue));
		}

		setAggregationData(methodsData);
	};

	const copyAggregation = (index: number) => {
		navigator.clipboard.writeText(aggregationData[index]);
		showPopover(t("share.popover"));
	};

	const onOpenChange = (open: boolean) => {
		if (open) calcAggregation();
	};

	return (
		<DropdownMenu onOpenChange={onOpenChange}>
			<DropdownMenuTrigger asChild>
				<Button disabled={disabled}>
					<div className="iconFrame">
						<Icon code="sigma" />
						<Icon code="chevron-down" style={{ marginLeft: "4px" }} />
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{Object.values(AggregationMethod).map((method, index) => (
					<Tooltip key={method}>
						<TooltipContent>
							{methodsWithTooltip[method] && t(`editor.table.aggregation.methods.${method}.tooltip`)}
						</TooltipContent>
						<TooltipTrigger asChild>
							<DropdownMenuItem key={method} onSelect={() => copyAggregation(index)}>
								<div className="flex items-center gap-2 w-full justify-between">
									<div className="flex items-center gap-2">
										<Icon code={aggregationMethodIcons[method]} />
										{t(`editor.table.aggregation.methods.${method}.name`)}
									</div>
									<span>{aggregationData[index]}</span>
								</div>
							</DropdownMenuItem>
						</TooltipTrigger>
					</Tooltip>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default TableAggregation;
