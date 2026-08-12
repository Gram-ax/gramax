import {
	getAggregatedValue,
	getFormattedValue,
	getFormatter,
} from "@ext/markdown/elements/table/edit/logic/aggregation";
import { AlignEnumTypes, type TableAggregationData } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { useMemo } from "react";

interface AggregationFooterProps {
	aggregation?: TableAggregationData;
}
const NULL_VALUE = "-";

const AggregationFooter = ({ aggregation }: AggregationFooterProps) => {
	const cells = useMemo(() => {
		if (!aggregation?.enabled) return [];

		const formatter = getFormatter();
		return aggregation.cells.map((cell) => {
			const value = cell.method ? getAggregatedValue(cell.method, cell.data) : null;
			return {
				...cell,
				value: value || value === 0 ? getFormattedValue(formatter, value) : NULL_VALUE,
			};
		});
	}, [aggregation]);

	if (!cells.length) return null;

	return (
		<tfoot contentEditable={false} data-aggregation="true" suppressContentEditableWarning>
			<tr>
				{cells.map((cell) => (
					<td
						align={cell.align || AlignEnumTypes.LEFT}
						colSpan={cell.colspan > 1 ? cell.colspan : undefined}
						key={`${cell.realColStart}-${cell.visualColStart}`}
					>
						{cell.value}
					</td>
				))}
			</tr>
		</tfoot>
	);
};

export default AggregationFooter;
