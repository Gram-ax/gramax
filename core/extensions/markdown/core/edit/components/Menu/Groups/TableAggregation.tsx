import { Editor } from "@tiptap/core";
import {
	AggregationMethod,
	aggregationMethodIcons,
	methodsWithTooltip,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import { memo, useState, useCallback } from "react";
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
import { ToolbarIcon, ToolbarTrigger } from "@ui-kit/Toolbar";
import { Icon } from "@ui-kit/Icon";
import { ComponentVariantProvider } from "@ui-kit/Providers";

type AggregationData = string[];

const TableAggregation = memo(({ editor, disabled }: { editor: Editor; disabled: boolean }) => {
	const [aggregationData, setAggregationData] = useState<AggregationData>([]);

	const calcAggregation = useCallback(() => {
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
	}, [editor]);

	const copyAggregation = useCallback(
		(index: number) => {
			navigator.clipboard.writeText(aggregationData[index]);
			showPopover(t("share.popover"));
		},
		[aggregationData],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (open) calcAggregation();
		},
		[calcAggregation],
	);

	return (
		<ComponentVariantProvider variant="inverse">
			<DropdownMenu onOpenChange={onOpenChange}>
				<DropdownMenuTrigger asChild>
					<ToolbarTrigger disabled={disabled}>
						<ToolbarIcon icon="sigma" />
						<ToolbarIcon icon="chevron-down" />
					</ToolbarTrigger>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="bottom" sideOffset={8} align="start">
					{Object.values(AggregationMethod).map((method, index) => (
						<Tooltip key={method}>
							<TooltipContent>
								{methodsWithTooltip[method] && t(`editor.table.aggregation.methods.${method}.tooltip`)}
							</TooltipContent>
							<TooltipTrigger asChild>
								<DropdownMenuItem key={method} onSelect={() => copyAggregation(index)}>
									<div className="flex items-center gap-2 w-full justify-between">
										<div className="flex items-center gap-2">
											<Icon icon={aggregationMethodIcons[method]} />
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
		</ComponentVariantProvider>
	);
});

export default TableAggregation;
