import DateUtils from "@core-ui/utils/dateUtils";
import Tooltip from "./Tooltip";

const Date = ({ date, className }: { date: string; className?: string }) => {
	const relativeDate = DateUtils.getRelativeDateTime(date);
	const dateViewModel = DateUtils.getDateViewModel(date);
	return (
		<Tooltip content={dateViewModel}>
			<span className={className}>{relativeDate}</span>
		</Tooltip>
	);
};

export default Date;
