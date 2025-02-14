import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { Editor } from "@tiptap/core";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { TriggerParent } from "@ext/markdown/elements/table/edit/components/Helpers/PlusMenu";
import Icon from "@components/Atoms/Icon";
import {
	AggregationMethod,
	aggregationMethodIcons,
	methodsWithTooltip,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useState } from "react";
import {
	getAggregatedValue,
	getFormattedValue,
	getFormatter,
} from "@ext/markdown/elements/table/edit/logic/aggregation";
import t from "@ext/localization/locale/translate";
import { CellSelection } from "prosemirror-tables";
import { AggregationItem } from "@ext/markdown/elements/table/edit/components/Helpers/AggregationPopup";
import Tooltip from "@components/Atoms/Tooltip";
import { showPopover } from "@core-ui/showPopover";

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

	return (
		<PopupMenuLayout
			onOpen={calcAggregation}
			tooltipText={t("editor.table.aggregation.name")}
			disabled={disabled}
			trigger={
				<TriggerParent>
					<Button disabled={disabled}>
						<div className="iconFrame">
							<Icon code="sigma" />
							<Icon code="chevron-down" style={{ marginLeft: "4px" }} />
						</div>
					</Button>
				</TriggerParent>
			}
		>
			{Object.values(AggregationMethod).map((method, index) => (
				<Tooltip
					key={method}
					hideOnClick={true}
					delay={[1000, 0]}
					content={
						methodsWithTooltip[method]
							? t(`editor.table.aggregation.methods.${method}.tooltip`) + " " + t("click-to-copy")
							: t("click-to-copy")
					}
				>
					<AggregationItem onClick={() => copyAggregation(index)}>
						<ButtonLink
							text={t(`editor.table.aggregation.methods.${method}.name`)}
							iconCode={aggregationMethodIcons[method]}
						/>
						<span>{aggregationData[index]}</span>
					</AggregationItem>
				</Tooltip>
			))}
		</PopupMenuLayout>
	);
};

export default TableAggregation;
