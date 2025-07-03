import DateUtils, { DateType } from "@core-ui/utils/dateUtils";
import { Props } from "tippy.js";
import Tooltip from "./Tooltip";

interface DateProps {
	date: DateType;
	tooltipDelay?: Props["delay"];
	tooltipAppendTo?: Props["appendTo"];
	className?: string;
}

const Date = ({ date, className, tooltipDelay, tooltipAppendTo }: DateProps) => {
	const relativeDate = DateUtils.getRelativeDateTime(date);
	const dateViewModel = DateUtils.getDateViewModel(date);
	return (
		<Tooltip delay={tooltipDelay} content={dateViewModel} appendTo={tooltipAppendTo}>
			<span className={className}>{relativeDate}</span>
		</Tooltip>
	);
};

export default Date;
