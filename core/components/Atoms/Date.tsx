import DateUtils from "@core-ui/utils/dateUtils";
import Tooltip from "./Tooltip";
import { Props } from "tippy.js";

interface DateProps {
	date: string;
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
